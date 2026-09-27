/**
 * Read-only health checks for daily-verse notifications.
 *
 * Nothing here requests permission or registers anything — opening the
 * diagnostics modal must never burn the browser's one-shot prompt.
 */

import {
  currentSubscription,
  deviceTimezone,
  hasCurrentApplicationKey,
  isIosThirdPartyBrowser,
  isStandalone,
  permissionState,
  readPushTime,
} from "./subscribe";
import { serviceWorkerAllowed } from "@/lib/pwa/register-sw";

export type CheckState = "pass" | "warn" | "fail";

export type DiagnosticCheck = {
  id: string;
  label: string;
  state: CheckState;
  detail: string;
};

export type Verdict = "ready" | "blocked" | "unsupported" | "context" | "worker" | "off" | "server";

export type DiagnosticsReport = {
  checks: DiagnosticCheck[];
  verdict: Verdict;
  summary: string;
  raw: string;
};

function isIos() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" &&
      (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1)
  );
}

export function unblockSteps() {
  if (typeof navigator === "undefined") return "Allow notifications for this site, then reload.";
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) {
    return "Chrome on Android: tap the ⋮ menu → Settings → Site settings → Notifications → mybibleatlas.com → Allow. Then reload and re-run these checks.";
  }
  if (/Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) {
    return "Safari: Safari menu → Settings → Websites → Notifications → set mybibleatlas.com to Allow. Then reload and re-run these checks.";
  }
  return "Click the lock or tune icon left of the address bar → Notifications → Allow. Then reload and re-run these checks.";
}

function endpointHost(endpoint: string) {
  try {
    return new URL(endpoint).host;
  } catch {
    return "unknown";
  }
}

async function backendHasDevice(endpoint: string): Promise<"yes" | "no" | "unreachable"> {
  try {
    const res = await fetch(`/api/public/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return "unreachable";
    const body = (await res.json()) as { registered?: boolean };
    return body.registered ? "yes" : "no";
  } catch {
    return "unreachable";
  }
}

export async function runPushDiagnostics(): Promise<DiagnosticsReport> {
  const checks: DiagnosticCheck[] = [];
  const time = readPushTime();
  const zone = deviceTimezone();
  const notes: string[] = [];

  const iosBrowser = isIosThirdPartyBrowser();
  const supported =
    !iosBrowser &&
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  checks.push({
    id: "support",
    label: "Browser support",
    state: supported ? "pass" : "fail",
    detail: supported
      ? "This browser can receive web push notifications."
      : iosBrowser
        ? "Chrome, Firefox and Edge on iPhone and iPad can't receive web push at all — Apple only allows it in Safari-installed apps. Open mybibleatlas.com in Safari, tap Share → Add to Home Screen, then turn Daily verse on from that app."
        : "This browser can't receive web push. Use Chrome, Edge or Firefox on desktop and Android, or Safari 16.4+ on iPhone and iPad.",
  });

  const ios = isIos();
  const installed = isStandalone();
  if (ios && !iosBrowser) {
    checks.push({
      id: "installed",
      label: "Added to Home Screen",
      state: installed ? "pass" : "fail",
      detail: installed
        ? "Bible Atlas is running as an installed app."
        : "Safari only allows notifications for installed apps. Tap Share, then Add to Home Screen, and open Bible Atlas from there.",
    });
  }

  const allowed = serviceWorkerAllowed();
  checks.push({
    id: "context",
    label: "Site context",
    state: allowed ? "pass" : "fail",
    detail: allowed
      ? "Running on the published site, where notifications are enabled."
      : "Notifications only run on the published site — not in the editor preview, an embedded frame or local development. Open mybibleatlas.com in its own tab.",
  });

  const permission = permissionState();
  checks.push({
    id: "permission",
    label: "Notification permission",
    state: permission === "granted" ? "pass" : permission === "denied" ? "fail" : "warn",
    detail:
      permission === "granted"
        ? "Allowed for this site."
        : permission === "denied"
          ? unblockSteps()
          : permission === "default"
            ? "Not asked yet. Allow the prompt when you tap Daily verse."
            : "The Notification API isn't available in this browser.",
  });

  let workerState = "none";
  let scope = "-";
  if (supported) {
    let registration: ServiceWorkerRegistration | null = null;
    try {
      registration = (await navigator.serviceWorker.getRegistration("/")) ?? null;
    } catch {
      registration = null;
    }
    scope = registration?.scope ?? "-";
    workerState = registration?.active
      ? "active"
      : registration?.waiting
        ? "waiting"
        : registration?.installing
          ? "installing"
          : "none";
    checks.push({
      id: "worker",
      label: "Notification service",
      state: workerState === "active" ? "pass" : workerState === "none" ? "fail" : "warn",
      detail:
        workerState === "active"
          ? "Running and ready to receive pushes."
          : workerState === "none"
            ? "Not started on this device. Reload the page to start it, then re-run these checks."
            : `Still starting (${workerState}). Give it a moment, then re-run these checks.`,
    });
  }

  let subscription: PushSubscription | null = null;
  try {
    subscription = await currentSubscription();
  } catch {
    subscription = null;
  }
  const keyMatches = subscription ? hasCurrentApplicationKey(subscription) : false;
  checks.push({
    id: "subscription",
    label: "Device registration",
    state: subscription ? (keyMatches ? "pass" : "warn") : "warn",
    detail: subscription
      ? keyMatches
        ? `Registered with ${endpointHost(subscription.endpoint)}.`
        : "Registered with an older notification key. Turn Daily verse off and on again to re-register this device."
      : "This device isn't registered yet. Turn Daily verse on to register it.",
  });

  let backend: "yes" | "no" | "unreachable" | "skipped" = "skipped";
  if (subscription) {
    backend = await backendHasDevice(subscription.endpoint);
    checks.push({
      id: "backend",
      label: "Saved on our side",
      state: backend === "yes" ? "pass" : backend === "no" ? "fail" : "warn",
      detail:
        backend === "yes"
          ? "We have this device saved and scheduled."
          : backend === "no"
            ? "Your browser is registered but we don't have this device saved. Turn Daily verse off and on again."
            : "We couldn't reach the notification service to confirm. Check your connection and try again in a moment.",
    });
  }

  let verdict: Verdict = "ready";
  let summary = `Everything looks ready — next verse at ${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}, ${zone}.`;
  if (!supported || (ios && !installed)) {
    verdict = "unsupported";
    summary = iosBrowser
      ? "Notifications need Safari on iPhone — open Bible Atlas in Safari and add it to your Home Screen."
      : ios
        ? "Add Bible Atlas to your Home Screen from Safari to receive notifications."
        : "This browser can't receive notifications as it is.";
  } else if (!allowed) {
    verdict = "context";
    summary = "Notifications only work on the published Bible Atlas site.";
  } else if (permission === "denied") {
    verdict = "blocked";
    summary = "Notifications are blocked in your browser settings.";
  } else if (workerState !== "active") {
    verdict = "worker";
    summary = "The notification service hasn't started on this device.";
  } else if (!subscription || !keyMatches) {
    verdict = "off";
    summary = "Daily verse isn't switched on for this device yet.";
  } else if (backend !== "yes") {
    verdict = "server";
    summary = "This device is registered in your browser but not confirmed on our side.";
  }

  notes.push(
    `verdict: ${verdict}`,
    `permission: ${permission ?? "unavailable"}`,
    `service worker: ${workerState}`,
    `scope: ${scope}`,
    `context allowed: ${allowed}`,
    `standalone: ${installed}`,
    `subscription: ${subscription ? "yes" : "no"}`,
    `endpoint host: ${subscription ? endpointHost(subscription.endpoint) : "none"}`,
    `key matches: ${subscription ? keyMatches : "n/a"}`,
    `backend record: ${backend}`,
    `timezone: ${zone}`,
    `time: ${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`,
    `url: ${typeof window !== "undefined" ? window.location.origin : "-"}`,
    `user agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "-"}`,
  );

  return { checks, verdict, summary, raw: notes.join("\n") };
}
