/**
 * Anonymous analytics for the "What's new" release-notes surfaces.
 *
 * Fire-and-forget: analytics must never break or slow the reader, so every
 * failure is swallowed. The only identifier is a random per-device id kept in
 * localStorage — no accounts, no personal data.
 */

import { supabase } from "@/integrations/supabase/client";
import { latestVersion } from "@/lib/release-notes";

export type WhatsNewEvent =
  | "banner_impression"
  | "banner_click"
  | "banner_dismiss"
  | "nav_click"
  | "page_view";

const DEVICE_KEY = "bible-atlas:device-id";
const IMPRESSION_KEY = "bible-atlas:wn-impressions";

function deviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `d-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return "unknown";
  }
}

export function trackWhatsNew(
  event: WhatsNewEvent,
  payload: { lastSeen?: string | null; unseenCount?: number } = {},
) {
  if (typeof window === "undefined") return;
  try {
    void supabase
      .from("whats_new_events")
      .insert({
        event,
        release_version: latestVersion(),
        last_seen_version: payload.lastSeen ?? null,
        unseen_count: payload.unseenCount ?? 0,
        device_id: deviceId(),
      })
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    /* analytics never breaks reading */
  }
}

/**
 * Records a banner impression at most once per device per release, so a reader
 * paging through chapters isn't counted on every screen.
 */
export function trackBannerImpressionOnce(payload: {
  lastSeen?: string | null;
  unseenCount?: number;
}) {
  if (typeof window === "undefined") return;
  const version = latestVersion();
  try {
    if (localStorage.getItem(IMPRESSION_KEY) === version) return;
    localStorage.setItem(IMPRESSION_KEY, version);
  } catch {
    /* if storage is unavailable, still record the impression */
  }
  trackWhatsNew("banner_impression", payload);
}
