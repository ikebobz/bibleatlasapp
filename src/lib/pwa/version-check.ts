/**
 * Forced version check for installed apps.
 *
 * The service worker only learns about a release when it happens to re-fetch
 * itself and Workbox spots a byte difference. That can silently never happen,
 * leaving a home-screen app pinned on an old bundle forever. This asks the
 * server directly which build it is serving and escalates until the device is
 * running it: worker update -> activate waiting worker -> cache-bypassing
 * reload. A session guard makes a reload loop impossible.
 */

import { applyUpdate } from "./update";
import { ensureServiceWorker, serviceWorkerAllowed } from "./register-sw";
import { anyDownloading } from "@/lib/offline/kjv-download";

const ENDPOINT = "/api/public/build";
const RELOAD_GUARD_KEY = "bible-atlas:forced-reload";
/** Don't hammer the endpoint when the app is foregrounded repeatedly. */
const MIN_INTERVAL_MS = 5 * 60 * 1000;

let lastCheck = 0;
let running = false;

/** Guard is per target build, so a later release in the same session still forces. */
function alreadyForced(target: string): boolean {
  try {
    return sessionStorage.getItem(RELOAD_GUARD_KEY) === target;
  } catch {
    return false;
  }
}

function markForced(target: string) {
  try {
    sessionStorage.setItem(RELOAD_GUARD_KEY, target);
  } catch {
    /* ignore */
  }
}

async function servedBuildId(): Promise<string | null> {
  try {
    const res = await fetch(ENDPOINT, { cache: "no-store", credentials: "omit" });
    if (!res.ok) return null;
    const data = (await res.json()) as { buildId?: unknown };
    return typeof data.buildId === "string" ? data.buildId : null;
  } catch {
    return null;
  }
}

function localBuildId(): string | null {
  try {
    return typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : null;
  } catch {
    return null;
  }
}

/**
 * Reload past every cache. The old worker answers navigations from its
 * precached shell, so a plain reload would boot the stale bundle again —
 * drop the worker and its precache first (downloaded Bibles live in
 * IndexedDB and saved maps in their own caches, so both are untouched).
 */
async function hardReload(target: string) {
  markForced(target);
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(regs.map((r) => r.unregister()));
    const names = await caches.keys();
    await Promise.allSettled(
      names.filter((n) => /workbox-precache/.test(n)).map((n) => caches.delete(n)),
    );
  } catch {
    /* reload anyway */
  }
  const url = new URL(window.location.href);
  url.searchParams.set("_v", Date.now().toString(36));
  window.location.replace(url.toString());
}

/**
 * Run one check. Returns true when a reload was triggered.
 * Safe to call often — throttled, guarded and silent on failure.
 */
export async function checkForNewBuild(force = false): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!serviceWorkerAllowed()) return false; // dev, preview, iframe, ?sw=off
  if (navigator.onLine === false) return false;
  // Never yank the page out from under an in-progress Bible download.
  if (anyDownloading()) return false;
  if (running) return false;
  if (!force && Date.now() - lastCheck < MIN_INTERVAL_MS) return false;

  running = true;
  lastCheck = Date.now();
  try {
    const local = localBuildId();
    const served = await servedBuildId();
    if (!local || !served || local === served) return false;
    if (alreadyForced(served)) return false; // fall back to the polite update prompt

    // Out of date for certain. Give the worker a chance to swap cleanly first.
    const registration = await ensureServiceWorker();
    if (registration) {
      try {
        await registration.update();
      } catch {
        /* fall through to the hard reload */
      }
      const waiting = await waitForWaitingWorker(registration, 4000);
      if (waiting) {
        markForced(served);
        applyUpdate(waiting);
        return true;
      }
    }

    await hardReload(served);
    return true;
  } finally {
    running = false;
  }
}

function waitForWaitingWorker(
  registration: ServiceWorkerRegistration,
  ms: number,
): Promise<ServiceWorker | null> {
  if (registration.waiting) return Promise.resolve(registration.waiting);
  return new Promise((resolve) => {
    const done = (worker: ServiceWorker | null) => {
      window.clearTimeout(timer);
      registration.removeEventListener("updatefound", onUpdateFound);
      resolve(worker);
    };
    const timer = window.setTimeout(() => done(registration.waiting ?? null), ms);
    const onUpdateFound = () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && registration.waiting) {
          done(registration.waiting);
        }
      });
    };
    registration.addEventListener("updatefound", onUpdateFound);
  });
}

/**
 * Check on launch and whenever the app comes back to the foreground.
 * Returns a cleanup function.
 */
export function watchBuildVersion(): () => void {
  if (typeof window === "undefined") return () => undefined;

  void checkForNewBuild(true);

  const onVisible = () => {
    if (document.visibilityState === "visible") void checkForNewBuild();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);

  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onVisible);
  };
}
