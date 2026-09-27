/**
 * Service-worker registration wrapper.
 *
 * Offline support only ever runs on the published site. In dev, inside the
 * Lovable editor preview, in an iframe, or with `?sw=off`, any existing
 * registration is removed instead.
 */

const SW_URL = "/sw.js";
const SW_VERSION = "share-handoff-v2";
const VERSIONED_SW_URL = `${SW_URL}?v=${SW_VERSION}`;
const SW_SCOPE = "/";
const RELOAD_KEY = `bible-atlas:worker-reload:${SW_VERSION}`;

let applyingUpdate = false;

/** Set by the update prompt so the automatic reload guard stays out of the way. */
export function markUpdateApplying() {
  applyingUpdate = true;
}

function previewHost(hostname: string) {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterExisting() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").includes(SW_URL))
        .map((r) => r.unregister()),
    );
  } catch {
    /* best effort */
  }
}

/** True when this context is allowed to run the app service worker. */
export function serviceWorkerAllowed() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  const params = new URLSearchParams(window.location.search);
  const refused =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    previewHost(window.location.hostname) ||
    params.get("sw") === "off";
  return !refused;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

function waitForState(
  worker: ServiceWorker,
  wanted: ServiceWorkerState,
  ms: number,
): Promise<boolean> {
  if (worker.state === wanted) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      worker.removeEventListener("statechange", onChange);
      resolve(false);
    }, ms);
    const onChange = () => {
      if (worker.state !== wanted) return;
      window.clearTimeout(timer);
      worker.removeEventListener("statechange", onChange);
      resolve(true);
    };
    worker.addEventListener("statechange", onChange);
  });
}

async function attemptRegistration(): Promise<ServiceWorkerRegistration | null> {
  // Registering the versioned URL replaces older workers on this same scope.
  const registration = await navigator.serviceWorker.register(VERSIONED_SW_URL, {
    scope: SW_SCOPE,
    updateViaCache: "none",
  });
  try {
    await registration.update();
  } catch {
    /* an update check is helpful, but not required for an existing worker */
  }
  if (registration.active) return registration;

  const candidate = registration.installing ?? registration.waiting;
  if (candidate) await waitForState(candidate, "activated", 8000);
  if (registration.active) return registration;

  // Android Chrome can leave `ready` pending for a while on a cold first visit,
  // so cap the wait and let the caller retry instead of hanging the toggle.
  await withTimeout(navigator.serviceWorker.ready, 8000);
  const settled = (await navigator.serviceWorker.getRegistration(SW_SCOPE)) ?? registration;
  return settled.active ? settled : null;
}

/**
 * Register (or reuse) the app worker and resolve once it is active.
 * Push subscription needs an active worker, so callers await this instead of
 * assuming registration already finished during page load. Retries because a
 * first-visit registration on Android Chrome can time out once and then work.
 */
export async function ensureServiceWorker(attempts = 2): Promise<ServiceWorkerRegistration | null> {
  if (!serviceWorkerAllowed()) {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      await unregisterExisting();
    }
    return null;
  }
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const registration = await attemptRegistration();
      if (registration) return registration;
    } catch {
      /* fall through to the retry delay */
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  // Last resort: an installing/waiting worker is still better than nothing.
  try {
    return (await navigator.serviceWorker.getRegistration(SW_SCOPE)) ?? null;
  } catch {
    return null;
  }
}
export function registerOfflineWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (!serviceWorkerAllowed()) {
    void unregisterExisting();
    return;
  }

  const onControllerChange = () => {
    if (applyingUpdate) return; // the update prompt owns that reload
    try {
      if (sessionStorage.getItem(RELOAD_KEY)) return;
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };
  navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, { once: true });

  const register = () => void ensureServiceWorker();

  // Hydration can happen after `load` has already fired, so register directly.
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
