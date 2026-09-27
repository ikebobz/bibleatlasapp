/** Map fallback diagnostics and the single rule deciding when Mapbox has truly failed. */

export function mapDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("atlasDebug") === "1" || new URLSearchParams(window.location.search).has("mapdebug");
  } catch {
    return false;
  }
}

/** Logs a map health event, only when debugging is switched on (?mapdebug=1 or localStorage.atlasDebug=1). */
export function mapWarn(reason: string, details?: unknown) {
  if (mapDebugEnabled()) console.warn(`[atlas-map] ${reason}`, details ?? "");
}

/** Auth or quota failures mean the live map cannot work for this visit. Everything else
 *  (a missing tile, sprite, glyph, a network blip) is transient and ignored. */
export function isFatalMapError(status: number | undefined): boolean {
  return status === 401 || status === 403 || status === 429;
}

/** Timing rules for the fallback decision. */
export const STYLE_LOAD_TIMEOUT_MS = 10_000;
/** Absolute cap on waiting for the first load while data keeps arriving. */
export const STYLE_LOAD_HARD_CAP_MS = 30_000;

/** Give up on the first load only after 10 s with no progress, or 30 s overall. */
export function loadTimedOut(elapsedMs: number, sinceProgressMs: number): boolean {
  return elapsedMs >= STYLE_LOAD_HARD_CAP_MS || sinceProgressMs >= STYLE_LOAD_TIMEOUT_MS;
}

/** True when the browser can draw WebGL (hardware acceleration on, not blocked). */
export function webglSupported(): boolean {
  if (typeof document === "undefined") return true;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Plain-language reason shown next to the fallback note. */
export function fallbackMessage(reason: string): string {
  if (reason.includes("webgl") || reason.includes("graphics")) return "your browser has graphics acceleration turned off";
  if (/40[13]|429/.test(reason)) return "the map service refused the request";
  if (reason.includes("did not load") || reason.includes("failed to load")) return "the map took too long or was blocked";
  return "the map could not start";
}
export const CONTEXT_RESTORE_GRACE_MS = 3_000;

/** Once the live map fails in a visit, the offline atlas stays for the rest of it. */
let liveMapFailed: string | null = null;
export const liveMapFailedThisSession = () => liveMapFailed !== null;
export const liveMapFailReason = () => liveMapFailed;
export function markLiveMapFailed(reason = "unknown") {
  liveMapFailed = reason;
  try {
    window.localStorage.setItem("atlasLastMapFailure", `${new Date().toISOString()} ${reason}`);
  } catch {
    /* storage unavailable */
  }
}
export function clearLiveMapFailed() {
  liveMapFailed = null;
}
