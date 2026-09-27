import { useCallback, useEffect, useRef, useState } from "react";

import {
  currentSubscription,
  deviceTimezone,
  readPushTime,
  disableDailyVerse,
  enableDailyVerse,
  permissionState,
  savePushPrefs,
  pushAvailability,
  sendTestNotification,
  writePushTime,
  type EnableStep,
  type PushTime,
} from "@/lib/push/subscribe";
import { ensureServiceWorker } from "@/lib/pwa/register-sw";
import { useSettings } from "./settings";

export type PushStatus =
  | "checking"
  | "unsupported"
  | "blocked"
  | "disabled"
  | "subscribing"
  | "enabled"
  | "error";

export const PUSH_STEP_LABEL: Record<EnableStep, string> = {
  permission: "Asking permission…",
  worker: "Starting the notification service…",
  subscribe: "Registering this device…",
  save: "Saving your settings…",
};

const pad = (value: number) => String(value).padStart(2, "0");

export function toInputValue(time: PushTime) {
  return `${pad(time.hour)}:${pad(time.minute)}`;
}

/** Snap a picked time onto the quarter-hour grid the scheduler runs on. */
export function fromInputValue(value: string): PushTime | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Math.round(Number(match[2]) / 15) * 15;
  if (hour < 0 || hour > 23) return null;
  return minute === 60 ? { hour: (hour + 1) % 24, minute: 0 } : { hour, minute };
}

export function formatTime(time: PushTime) {
  const suffix = time.hour < 12 ? "AM" : "PM";
  const hour12 = time.hour % 12 === 0 ? 12 : time.hour % 12;
  return `${hour12}:${pad(time.minute)} ${suffix}`;
}

export function unblockSteps() {
  if (typeof navigator === "undefined") return "Allow notifications for this site, then reload.";
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) {
    return "Chrome on Android: tap the ⋮ menu → Settings → Site settings → Notifications → mybibleatlas.com → Allow. Then reload this page and try again.";
  }
  if (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) {
    return "Safari: Safari menu → Settings → Websites → Notifications → set mybibleatlas.com to Allow. Then reload this page and try again.";
  }
  return "Click the lock/tune icon left of the address bar → Notifications → Allow. Then reload this page and try again.";
}

/**
 * Owns the whole Daily verse state machine: browser support, permission,
 * service-worker readiness, subscription reconciliation and delivery time.
 * The card that renders it stays purely presentational.
 */
export function usePushState() {
  const { translation } = useSettings();
  const [status, setStatus] = useState<PushStatus>("checking");
  const [detail, setDetail] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [step, setStep] = useState<EnableStep | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [time, setTime] = useState<PushTime>(() => readPushTime());
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const alive = useRef(true);
  const zone = deviceTimezone();
  const on = status === "enabled";

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const inspect = useCallback(async () => {
    setStatus("checking");
    setDetail(null);
    setCode(null);
    const state = await pushAvailability();
    if (!alive.current) return;

    if (state.state !== "ready") {
      setStatus("unsupported");
      setDetail(
        state.state === "ios-browser"
          ? "On iPhone and iPad, daily verse notifications only work in Safari. Open mybibleatlas.com in Safari, tap Share → Add to Home Screen, then turn this on from the Home Screen app."
          : state.state === "install-first"
            ? "Tap Share, then Add to Home Screen, open Bible Atlas from your Home Screen, and turn this on there — Safari only allows notifications for installed apps."
            : state.state === "no-worker"
              ? "Daily verse notifications only run on the published Bible Atlas site, not inside the editor preview."
              : "This browser doesn't support web push notifications.",
      );
      return;
    }
    if (permissionState() === "denied") {
      setStatus("blocked");
      setDetail(unblockSteps());
      return;
    }
    const [worker, sub] = await Promise.all([ensureServiceWorker(), currentSubscription()]);
    if (!alive.current) return;
    setRegistration(worker?.active ? worker : null);
    setSubscription(sub);
    if (!worker?.active) {
      setStatus("error");
      setDetail(
        "The notification service could not start. Reload the published Bible Atlas site and try again.",
      );
      return;
    }
    if (!sub) {
      setStatus("disabled");
      return;
    }
    // Reconcile subscriptions left behind by an interrupted/older setup.
    const restored = await enableDailyVerse(translation, readPushTime(), worker, sub);
    if (!alive.current) return;
    if (restored.ok) {
      setStatus("enabled");
      return;
    }
    setSubscription(null);
    setStatus("disabled");
  }, [translation]);

  useEffect(() => {
    void inspect();
  }, [inspect]);

  // Keep the worker's copy of the reading version in step with the reader.
  useEffect(() => {
    if (on) void savePushPrefs(translation);
  }, [on, translation]);

  const chooseTime = useCallback(
    (next: PushTime) => {
      setTime(next);
      // Persist immediately, whether or not Daily verse is on, so the choice
      // survives a reload.
      writePushTime(next);
      if (!on) {
        setNote(`Saved for ${formatTime(next)} — turn Daily verse on to start.`);
        return;
      }
      setNote(`Set for ${formatTime(next)} — ${zone}.`);
      void savePushPrefs(translation, next);
    },
    [on, translation, zone],
  );

  const activate = useCallback(() => {
    setNote(null);
    setDetail(null);
    setCode(null);

    // Ask for permission first, while the browser still counts this as a tap.
    // Android Chrome ignores requestPermission() once an await has run.
    const ask =
      typeof Notification !== "undefined" && Notification.permission === "default"
        ? Notification.requestPermission()
        : Promise.resolve(typeof Notification !== "undefined" ? Notification.permission : "denied");

    setStatus("subscribing");
    setStep("permission");
    void ask
      .then(async (permission) => {
        if (!alive.current) return;
        if (permission !== "granted") {
          if (permission === "denied") {
            setStatus("blocked");
            setDetail(unblockSteps());
          } else {
            setStatus("disabled");
            setNote("Notification permission wasn't granted — tap Daily verse to try again.");
          }
          return;
        }

        // Explicitly get the worker registered and active before subscribing —
        // on Android Chrome this can need a retry on a first visit.
        setStep("worker");
        let worker = registration;
        if (!worker?.active) worker = await ensureServiceWorker();
        if (!worker?.active) worker = await ensureServiceWorker();
        if (!alive.current) return;
        if (!worker?.active) {
          setStatus("error");
          setDetail(
            "The notification service could not start on this device. Reload the page and try again.",
          );
          return;
        }
        setRegistration(worker);

        const result = await enableDailyVerse(translation, time, worker, subscription, (next) => {
          if (alive.current) setStep(next);
        });
        if (!alive.current) return;
        if (result.ok) {
          setStatus("enabled");
          setSubscription(await currentSubscription());
          setNote(`You'll get today's verse at ${formatTime(time)}, ${zone}.`);
          return;
        }
        setSubscription(null);
        if (result.reason === "denied") {
          setStatus("blocked");
          setDetail(unblockSteps());
        } else if (result.reason === "unsupported") {
          setStatus("unsupported");
          setDetail("This browser doesn't support web push notifications.");
        } else if (result.reason === "worker") {
          setStatus("error");
          setDetail(
            "The notification service could not start. Reload the published Bible Atlas site and try again.",
          );
        } else if (result.reason === "save") {
          setStatus("error");
          setDetail(
            "Your browser is ready, but we couldn't save this device. Check your connection and try again in a moment.",
          );
          setCode(result.detail ?? null);
        } else {
          setStatus("error");
          setDetail(
            "Your browser couldn't create a notification subscription. This often clears after a reload — try again.",
          );
          setCode(result.detail ?? null);
        }
      })
      .catch((error: unknown) => {
        if (!alive.current) return;
        setStatus("error");
        setDetail("Couldn't turn notifications on. Reload the page and try again.");
        setCode(error instanceof Error ? error.message : String(error));
      });
  }, [registration, subscription, time, translation, zone]);

  const toggle = useCallback(() => {
    if (status === "enabled") {
      setNote(null);
      setStatus("subscribing");
      setStep("save");
      void disableDailyVerse().then(() => {
        if (!alive.current) return;
        setSubscription(null);
        setStatus("disabled");
      });
      return;
    }
    activate();
  }, [activate, status]);

  const test = useCallback(async () => {
    const ok = await sendTestNotification();
    setNote(ok ? "Test sent — it should arrive in a moment." : "Couldn't send the test push.");
  }, []);

  const statusLabel =
    status === "checking"
      ? "Checking this device…"
      : status === "unsupported"
        ? "Not supported here"
        : status === "blocked"
          ? "Blocked in browser settings"
          : status === "disabled"
            ? "Off"
            : status === "subscribing"
              ? step
                ? PUSH_STEP_LABEL[step]
                : "Working…"
              : status === "enabled"
                ? `On — next verse at ${formatTime(time)}, ${zone}`
                : "Something went wrong";

  return {
    status,
    statusLabel,
    detail,
    code,
    note,
    time,
    zone,
    on,
    canToggle: status === "disabled" || status === "enabled",
    inspect,
    activate,
    toggle,
    chooseTime,
    test,
  };
}
