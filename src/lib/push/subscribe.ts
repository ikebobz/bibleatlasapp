/**
 * Client side of daily-verse notifications.
 *
 * Registration piggybacks on the app's service worker, which only runs on the
 * published site — so the toggle explains itself rather than failing silently
 * inside the editor preview.
 */

import { ensureServiceWorker, serviceWorkerAllowed } from "@/lib/pwa/register-sw";
import { VAPID_PUBLIC_KEY } from "./keys";

const PREFS_CACHE = "bible-atlas-push-prefs";
const PREFS_URL = "/__push-prefs";
const TIME_KEY = "bible-atlas-push-time";

export type PushTime = { hour: number; minute: number };

export const DEFAULT_PUSH_TIME: PushTime = { hour: 7, minute: 0 };

export function deviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** The delivery time this device last saved, in its own local clock. */
export function readPushTime(): PushTime {
  if (typeof localStorage === "undefined") return DEFAULT_PUSH_TIME;
  try {
    const raw = localStorage.getItem(TIME_KEY);
    if (!raw) return DEFAULT_PUSH_TIME;
    const parsed = JSON.parse(raw) as Partial<PushTime>;
    const hour = Number(parsed.hour);
    const minute = Number(parsed.minute);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) return DEFAULT_PUSH_TIME;
    return { hour, minute: [0, 15, 30, 45].includes(minute) ? minute : 0 };
  } catch {
    return DEFAULT_PUSH_TIME;
  }
}

export function writePushTime(time: PushTime) {
  try {
    localStorage.setItem(TIME_KEY, JSON.stringify(time));
  } catch {
    /* private mode — the server copy is still authoritative */
  }
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushAvailability =
  | { state: "ready" }
  | { state: "install-first" }
  | { state: "ios-browser" }
  | { state: "unsupported" }
  | { state: "no-worker" };

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" &&
      (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1)
  );
}

/**
 * Chrome/Firefox/Edge on iOS run on WebKit but, unlike Safari, cannot install
 * a Home Screen app — so web push is impossible in them, whatever the user does.
 */
export function isIosThirdPartyBrowser() {
  if (typeof navigator === "undefined") return false;
  return isIos() && /CriOS|FxiOS|EdgiOS|OPiOS|Brave/i.test(navigator.userAgent);
}

export async function pushAvailability(): Promise<PushAvailability> {
  if (typeof window === "undefined") return { state: "unsupported" };
  if (isIosThirdPartyBrowser() && !isStandalone()) return { state: "ios-browser" };
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return isIos() && !isStandalone() ? { state: "install-first" } : { state: "unsupported" };
  }
  if (isIos() && !isStandalone()) return { state: "install-first" };
  // Contexts where we deliberately never register a worker (editor preview, dev).
  if (!serviceWorkerAllowed()) return { state: "no-worker" };
  // Otherwise the worker may simply still be installing — the toggle waits for it.
  return { state: "ready" };
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  // The argument is the registration scope, not the service-worker filename.
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/** True when the subscription was created with the key the server signs with. */
export function hasCurrentApplicationKey(subscription: PushSubscription) {
  const existing = subscription.options.applicationServerKey;
  if (!existing) return false;
  const current = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  const bytes = new Uint8Array(existing);
  return bytes.length === current.length && bytes.every((value, index) => value === current[index]);
}

const sameApplicationKey = hasCurrentApplicationKey;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms),
    ),
  ]);
}

/** Stash the reading preferences the service worker needs at push time. */
export async function savePushPrefs(translation: string, time?: PushTime) {
  if (time) writePushTime(time);
  try {
    const cache = await caches.open(PREFS_CACHE);
    await cache.put(
      PREFS_URL,
      new Response(JSON.stringify({ translation }), {
        headers: { "content-type": "application/json" },
      }),
    );
  } catch {
    /* preference is a nicety; the server defaults to KJV */
  }

  const subscription = await currentSubscription();
  if (!subscription) return;
  const json = subscription.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  const chosen = time ?? readPushTime();
  await fetch("/api/public/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      translation,
      timezone: deviceTimezone(),
      hour: chosen.hour,
      minute: chosen.minute,
    }),
  }).catch(() => undefined);
}

export type EnableStep = "permission" | "worker" | "subscribe" | "save";

export type EnableResult =
  | { ok: true }
  | {
      ok: false;
      reason: "denied" | "unsupported" | "worker" | "subscription" | "save";
      step: EnableStep;
      detail?: string;
    };

/** Current Notification permission, or null when the API is missing. */
export function permissionState(): NotificationPermission | null {
  if (typeof Notification === "undefined") return null;
  return Notification.permission;
}

function errorDetail(error: unknown) {
  if (error instanceof DOMException) return `${error.name}: ${error.message}`;
  return error instanceof Error ? error.message : String(error);
}

async function saveSubscription(
  subscription: PushSubscription,
  translation: string,
  time: PushTime,
): Promise<EnableResult> {
  const json = subscription.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    return {
      ok: false,
      reason: "subscription",
      step: "subscribe",
      detail: "Browser returned incomplete keys",
    };
  }

  try {
    const res = await withTimeout(
      fetch("/api/public/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          translation,
          timezone: deviceTimezone(),
          hour: time.hour,
          minute: time.minute,
        }),
      }),
      15000,
      "Saving notification settings",
    );
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
      return {
        ok: false,
        reason: "save",
        step: "save",
        detail: body?.code ?? body?.error ?? `HTTP ${res.status}`,
      };
    }
    writePushTime(time);
    await savePushPrefs(translation, time);
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: "save", step: "save", detail: errorDetail(error) };
  }
}

/**
 * Turn on daily verse pushes.
 *
 * Permission is requested by the caller inside the click handler: Android
 * Chrome drops transient user activation across awaits, so asking here would
 * silently reject the prompt.
 */
export async function enableDailyVerse(
  translation: string,
  time: PushTime = readPushTime(),
  preparedRegistration?: ServiceWorkerRegistration,
  preparedSubscription?: PushSubscription | null,
  onStep?: (step: EnableStep) => void,
): Promise<EnableResult> {
  if (
    typeof window === "undefined" ||
    typeof Notification === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return { ok: false, reason: "unsupported", step: "permission" };
  }
  if (Notification.permission !== "granted") {
    return { ok: false, reason: "denied", step: "permission" };
  }

  onStep?.("worker");
  const registration = preparedRegistration ?? (await ensureServiceWorker());
  if (!registration?.active) {
    return {
      ok: false,
      reason: "worker",
      step: "worker",
      detail: "Worker did not become active",
    };
  }

  try {
    // The toggle preloads this value before the tap. When it is supplied (even
    // as null), avoid an await before subscribe so mobile Chrome keeps the tap.
    onStep?.("subscribe");
    let subscription =
      preparedSubscription !== undefined
        ? preparedSubscription
        : await registration.pushManager.getSubscription();
    if (subscription && !sameApplicationKey(subscription)) {
      await subscription.unsubscribe();
      subscription = null;
    }
    if (!subscription) {
      subscription = await withTimeout(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }),
        15000,
        "Push subscription",
      );
    }
    onStep?.("save");
    const result = await saveSubscription(subscription, translation, time);
    if (!result.ok && result.reason === "save") {
      // Never leave a browser-only orphan that looks enabled after reload but
      // cannot receive scheduled sends from the backend.
      await subscription.unsubscribe().catch(() => false);
    }
    return result;
  } catch (error) {
    return {
      ok: false,
      reason: "subscription",
      step: "subscribe",
      detail: errorDetail(error),
    };
  }
}

export async function disableDailyVerse() {
  const subscription = await currentSubscription();
  if (!subscription) return;
  const json = subscription.toJSON() as {
    endpoint?: string;
    keys?: { auth?: string };
  };
  const endpoint = json.endpoint;
  const auth = json.keys?.auth;
  if (!endpoint || !auth) return;
  try {
    await subscription.unsubscribe();
  } catch {
    /* still drop the server record below */
  }
  await fetch("/api/public/push/unsubscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint, auth }),
  }).catch(() => undefined);
}

export async function sendTestNotification(): Promise<boolean> {
  const subscription = await currentSubscription();
  if (!subscription) return false;
  const res = await fetch("/api/public/push/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => null);
  return Boolean(res?.ok);
}
