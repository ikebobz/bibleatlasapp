/**
 * A single, reliable "the app got installed" signal across platforms.
 *
 * iOS never fires `appinstalled`, so the honest proof of an install is the
 * first time the site is seen running in standalone display mode. That is
 * recorded permanently so the event can only ever fire once per device.
 */

import { trackShare } from "@/lib/analytics/share-events";
import { detectPlatform, isStandaloneDisplay } from "./platform";

const COMPLETED_KEY = "bible-atlas:install-completed";
const FIRST_SEEN_KEY = "bible-atlas:first-seen";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function installCompletedRecorded(): boolean {
  return read(COMPLETED_KEY) !== null;
}

function daysSinceFirstVisit(): number {
  const raw = Number(read(FIRST_SEEN_KEY) ?? "0");
  if (!Number.isFinite(raw) || raw <= 0) {
    write(FIRST_SEEN_KEY, String(Date.now()));
    return 0;
  }
  return Math.max(0, Math.round((Date.now() - raw) / 86_400_000));
}

/** Fire `install_completed` exactly once, ever. Safe to call repeatedly. */
export function recordInstallCompleted(source: "standalone" | "appinstalled") {
  if (typeof window === "undefined") return false;
  if (installCompletedRecorded()) return false;
  write(COMPLETED_KEY, String(Date.now()));
  const info = detectPlatform();
  trackShare("install_completed", {
    resourceType: "chapter",
    resourceRef: `${source}/${info.kind}/${info.browser}/d${daysSinceFirstVisit()}`,
  });
  return true;
}

/**
 * Watch for the app entering standalone mode, now or later in the session,
 * and route the native Android/desktop event through the same once-only path.
 */
export function watchInstallCompletion(): () => void {
  if (typeof window === "undefined") return () => undefined;

  daysSinceFirstVisit(); // seed the first-visit stamp on the very first load

  if (isStandaloneDisplay()) recordInstallCompleted("standalone");

  const mq = window.matchMedia?.("(display-mode: standalone)");
  const onDisplayChange = (e: MediaQueryListEvent) => {
    if (e.matches) recordInstallCompleted("standalone");
  };
  mq?.addEventListener?.("change", onDisplayChange);

  const onInstalled = () => recordInstallCompleted("appinstalled");
  window.addEventListener("appinstalled", onInstalled);

  return () => {
    mq?.removeEventListener?.("change", onDisplayChange);
    window.removeEventListener("appinstalled", onInstalled);
  };
}
