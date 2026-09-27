/**
 * Anonymous analytics for the verse selector and the v2.1 announcement.
 *
 * Fire-and-forget: analytics must never break or slow the reader, so every
 * failure is swallowed. The only identifier is a random per-device id kept in
 * localStorage — no accounts, no personal data.
 */

import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/lib/version";

export type NavEvent =
  | "bible_selector_opened"
  | "book_selected"
  | "chapter_selected"
  | "verse_selector_opened"
  | "verse_selected"
  | "verse_navigation_completed"
  | "whats_new_shown"
  | "whats_new_dismissed"
  | "whats_new_cta_clicked"
  | "offline_kjv_prompt_shown"
  | "offline_kjv_prompt_dismissed"
  | "kjv_download_started"
  | "kjv_download_completed"
  | "kjv_download_failed"
  | "kjv_deleted"
  | "offline_mode_used" | "journey_selected" | "journey_stop_selected";

const DEVICE_KEY = "bible-atlas:device-id";
const FIRST_SEEN_KEY = "bible-atlas:first-seen";

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

function deviceType(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

/** A device that already existed before this session counts as returning. */
function readerType(): "new" | "returning" {
  try {
    const first = localStorage.getItem(FIRST_SEEN_KEY);
    if (!first) return "new";
    return Date.now() - new Date(first).getTime() > 60_000 ? "returning" : "new";
  } catch {
    return "new";
  }
}

export function trackNav(
  event: NavEvent,
  payload: { book?: string; chapter?: number; verse?: number } = {},
) {
  if (typeof window === "undefined") return;
  try {
    void supabase
      .from("nav_events")
      .insert({
        event,
        book: payload.book ?? null,
        chapter: payload.chapter ?? null,
        verse: payload.verse ?? null,
        device_type: deviceType(),
        reader_type: readerType(),
        release_version: APP_VERSION,
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
