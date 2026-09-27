/**
 * Update detection for the app service worker.
 *
 * The worker is generated with `autoUpdate`, so a new version installs itself
 * and then waits. Instead of reloading underneath the reader, we surface the
 * waiting worker to the UI and only reload when the user asks for it.
 */

import { ensureServiceWorker, markUpdateApplying, serviceWorkerAllowed } from "./register-sw";

let applying = false;

/** True when a reload was requested by the user via the update prompt. */
export function updateApplyRequested() {
  return applying;
}

type Listener = (waiting: ServiceWorker | null) => void;

/**
 * Watch the active registration for a waiting worker.
 * Returns a cleanup function.
 */
export function watchForUpdate(onWaiting: Listener): () => void {
  if (!serviceWorkerAllowed()) return () => undefined;

  let stopped = false;
  const cleanups: Array<() => void> = [];

  void ensureServiceWorker().then((registration) => {
    if (!registration || stopped) return;

    const report = () => {
      if (stopped) return;
      // A waiting worker only matters once something already controls the page,
      // otherwise this is the very first install and there is nothing to update.
      if (registration.waiting && navigator.serviceWorker.controller) {
        onWaiting(registration.waiting);
      }
    };

    report();

    const onUpdateFound = () => {
      const installing = registration.installing;
      if (!installing) return;
      const onStateChange = () => {
        if (installing.state === "installed") report();
      };
      installing.addEventListener("statechange", onStateChange);
      cleanups.push(() => installing.removeEventListener("statechange", onStateChange));
    };

    registration.addEventListener("updatefound", onUpdateFound);
    cleanups.push(() => registration.removeEventListener("updatefound", onUpdateFound));

    // Periodic check so long reading sessions still learn about a new release.
    const timer = window.setInterval(
      () => {
        void registration.update().catch(() => undefined);
      },
      60 * 60 * 1000,
    );
    cleanups.push(() => window.clearInterval(timer));

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void registration.update().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    cleanups.push(() => document.removeEventListener("visibilitychange", onVisible));
  });

  return () => {
    stopped = true;
    cleanups.forEach((fn) => fn());
  };
}

/**
 * Activate the waiting worker and reload once it takes control.
 * Downloaded Bible chapters live in IndexedDB and are untouched by this.
 */
export function applyUpdate(waiting: ServiceWorker) {
  applying = true;
  markUpdateApplying();
  let reloaded = false;
  const reload = () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  };
  navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
  try {
    waiting.postMessage({ type: "SKIP_WAITING" });
  } catch {
    /* fall through to the timeout reload */
  }
  // Some browsers never fire controllerchange for a manual skipWaiting.
  window.setTimeout(reload, 3000);
}
