import { getRequestHeader } from "@tanstack/react-start/server";

const ALLOWED = [
  /^https:\/\/(www\.)?mybibleatlas\.com$/,
  /^https:\/\/bibleatlas\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^http:\/\/localhost(:\d+)?$/,
];

/**
 * Paid AI features are open to signed-out readers, so only accept calls that
 * come from the app's own pages. Combined with per-visitor quotas and the
 * shared answer cache, this stops third parties spending the AI budget.
 */
export function requireSameOrigin() {
  let origin = getRequestHeader("origin") ?? "";
  if (!origin) {
    const ref = getRequestHeader("referer") ?? "";
    try {
      origin = ref ? new URL(ref).origin : "";
    } catch {
      origin = "";
    }
  }
  if (!ALLOWED.some((re) => re.test(origin))) {
    throw new Error("This feature is only available inside Bible Atlas.");
  }
}
