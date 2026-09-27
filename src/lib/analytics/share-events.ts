/**
 * Anonymous analytics for sharing and shared-link arrivals.
 *
 * Fire-and-forget: analytics must never break or slow the reader, so every
 * failure is swallowed. The only identifier is a random per-device id kept in
 * localStorage — no accounts, no personal data.
 */

import { supabase } from "@/integrations/supabase/client";
import type { ShareChannel } from "@/lib/share";

export type ShareEvent =
  | "share_opened" // user tapped Share
  | "share_sent" // user picked a channel
  | "link_opened" // a visitor arrived on a ?s=share link
  | "install_prompt_shown"
  | "install_prompt_opened"
  | "install_instructions_viewed"
  | "install_accepted"
  | "install_completed"
  | "update_prompt_shown"
  | "update_applied"
  | "standalone_app_opened"
  | "install_dismissed";

const DEVICE_KEY = "bible-atlas:device-id";

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

export function trackShare(
  event: ShareEvent,
  payload: {
    channel?: ShareChannel;
    resourceType?: "verse" | "entry" | "thread" | "chapter";
    resourceRef?: string;
    translation?: string;
  } = {},
) {
  if (typeof window === "undefined") return;
  try {
    void supabase
      .from("share_events")
      .insert({
        event,
        channel: payload.channel ?? null,
        resource_type: payload.resourceType ?? "verse",
        resource_ref: payload.resourceRef ?? null,
        translation: payload.translation ?? null,
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
