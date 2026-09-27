/**
 * Aggregated "What's new" analytics for the internal admin page.
 */

import { createServerFn } from "@tanstack/react-start";

export type WhatsNewStatRow = {
  version: string;
  impressions: number;
  clicks: number;
  dismissals: number;
  navClicks: number;
  pageViews: number;
  devices: number;
  clickThrough: number;
};

export type WhatsNewStatsResult =
  | { locked: true }
  | { locked: false; rows: WhatsNewStatRow[] };

export const getWhatsNewStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<WhatsNewStatsResult> => {
    const { isAdminSession } = await import("@/lib/admin/gate.server");
    if (!(await isAdminSession())) return { locked: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");


    const { data, error } = await supabaseAdmin
      .from("whats_new_events")
      .select("event, release_version, device_id")
      .order("created_at", { ascending: false })
      .limit(20000);

    if (error) {
      console.error("What's new stats failed", { code: error.code });
      return { locked: false, rows: [] };
    }

    const byVersion = new Map<string, WhatsNewStatRow & { deviceSet: Set<string> }>();
    for (const row of data ?? []) {
      const version = row.release_version;
      let entry = byVersion.get(version);
      if (!entry) {
        entry = {
          version,
          impressions: 0,
          clicks: 0,
          dismissals: 0,
          navClicks: 0,
          pageViews: 0,
          devices: 0,
          clickThrough: 0,
          deviceSet: new Set<string>(),
        };
        byVersion.set(version, entry);
      }
      entry.deviceSet.add(row.device_id);
      if (row.event === "banner_impression") entry.impressions += 1;
      else if (row.event === "banner_click") entry.clicks += 1;
      else if (row.event === "banner_dismiss") entry.dismissals += 1;
      else if (row.event === "nav_click") entry.navClicks += 1;
      else if (row.event === "page_view") entry.pageViews += 1;
    }

    const rows = [...byVersion.values()]
      .map(({ deviceSet, ...entry }) => ({
        ...entry,
        devices: deviceSet.size,
        clickThrough: entry.impressions > 0 ? entry.clicks / entry.impressions : 0,
      }))
      .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));

    return { locked: false, rows };
  },
);
