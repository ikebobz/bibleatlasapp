import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/**
 * Uptime probe for external monitors.
 *
 * Returns 200 only when the app can reach the database AND the daily-verse
 * cron has run recently; anything else returns 503 so a pinger (UptimeRobot,
 * Better Stack, cron-job.org) can alert without needing app credentials.
 */
export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        const started = Date.now();
        const checks: Record<string, { ok: boolean; detail?: string }> = {};

        let cronLastRun: string | null = null;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { error: dbError } = await supabaseAdmin
            .from("push_subscriptions")
            .select("id", { count: "exact", head: true });
          checks["database"] = { ok: !dbError, detail: dbError?.message };

          const { data: cron } = await supabaseAdmin
            .from("ops_metrics")
            .select("created_at, outcome")
            .eq("surface", "push.send-daily")
            .order("created_at", { ascending: false })
            .limit(1);

          const last = cron?.[0];
          cronLastRun = last?.created_at ?? null;
          if (!last) {
            // No heartbeat yet (fresh deploy) — not a failure on its own.
            checks["daily_verse_cron"] = { ok: true, detail: "no runs recorded yet" };
          } else {
            const ageMinutes = (Date.now() - new Date(last.created_at).getTime()) / 60_000;
            // Cron runs every 15 minutes; 60 gives room for a couple of misses.
            const fresh = ageMinutes < 60;
            checks["daily_verse_cron"] = {
              ok: fresh && last.outcome === "ok",
              detail: `last run ${Math.round(ageMinutes)}m ago (${last.outcome})`,
            };
          }
        } catch (error) {
          checks["database"] = { ok: false, detail: String(error).slice(0, 200) };
        }

        const ok = Object.values(checks).every((c) => c.ok);
        return Response.json(
          { ok, checks, cronLastRun, latencyMs: Date.now() - started, at: new Date().toISOString() },
          { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
        );
      },
    },
  },
});
