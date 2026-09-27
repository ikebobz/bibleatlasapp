/**
 * Aggregated sharing analytics for the internal admin page: how often verses
 * are shared, which channels people pick, and how many visits arrive on a
 * shared link.
 */

import { createServerFn } from "@tanstack/react-start";

export type ShareStats = {
  opened: number;
  sent: number;
  arrivals: number;
  installsShown: number;
  installsAccepted: number;
  devices: number;
  channels: { channel: string; count: number }[];
  topVerses: { reference: string; count: number }[];
};

export type ShareStatsResult = { locked: true } | { locked: false; stats: ShareStats };

export const getShareStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShareStatsResult> => {
    const { isAdminSession } = await import("@/lib/admin/gate.server");
    if (!(await isAdminSession())) return { locked: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");


    const { data, error } = await supabaseAdmin
      .from("share_events")
      .select("event, channel, resource_ref, device_id")
      .order("created_at", { ascending: false })
      .limit(20000);

    const empty: ShareStats = {
      opened: 0,
      sent: 0,
      arrivals: 0,
      installsShown: 0,
      installsAccepted: 0,
      devices: 0,
      channels: [],
      topVerses: [],
    };

    if (error) {
      console.error("Share stats failed", { code: error.code });
      return { locked: false, stats: empty };
    }

    const devices = new Set<string>();
    const channels = new Map<string, number>();
    const verses = new Map<string, number>();
    const stats = { ...empty };

    for (const row of data ?? []) {
      if (row.device_id) devices.add(row.device_id);
      if (row.event === "share_opened") stats.opened += 1;
      else if (row.event === "share_sent") {
        stats.sent += 1;
        const channel = row.channel ?? "unknown";
        channels.set(channel, (channels.get(channel) ?? 0) + 1);
        if (row.resource_ref) verses.set(row.resource_ref, (verses.get(row.resource_ref) ?? 0) + 1);
      } else if (row.event === "link_opened") stats.arrivals += 1;
      else if (row.event === "install_prompt_shown") stats.installsShown += 1;
      else if (row.event === "install_accepted") stats.installsAccepted += 1;
    }

    stats.devices = devices.size;
    stats.channels = [...channels.entries()]
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count);
    stats.topVerses = [...verses.entries()]
      .map(([reference, count]) => ({ reference, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { locked: false, stats };
  },
);
