import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { sendPush } from "@/lib/push/vapid.server";
import { flushOps, recordOps } from "@/lib/monitor.server";

function authorised(request: Request) {
  const secret = process.env["PUSH_CRON_SECRET"];
  return Boolean(secret) && request.headers.get("x-cron-secret") === secret;
}

type Local = { day: string; hour: number; minute: number };

/** Wall-clock time and calendar date in a device's own timezone. */
function localNow(timezone: string | null, at: Date): Local {
  const zone = timezone && timezone.trim() ? timezone.trim() : "UTC";
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(at);
  } catch {
    return localNow("UTC", at);
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  const hour = Number(get("hour")) % 24;
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    hour,
    minute: Number(get("minute")),
  };
}

/**
 * Cron (every 15 minutes): nudge the devices whose chosen local time has just
 * come round. The worker fetches the verse itself.
 */
export const Route = createFileRoute("/api/public/push/send-daily")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Loaded per request: route modules are client-reachable, so the service-role
        // client must never sit at module scope.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (!authorised(request)) return new Response("Unauthorized", { status: 401 });

        const now = new Date();
        const url = new URL(request.url);
        // `all=1` ignores the schedule — used for manual backfills.
        const ignoreSchedule = url.searchParams.get("all") === "1";

        const { data, error } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, endpoint, failure_count, timezone, send_hour, send_minute, last_sent_day")
          .limit(5000);
        if (error) {
          // Heartbeat + failure signal: the health endpoint and admin dashboard
          // both read these rows to spot a cron that has stopped working.
          recordOps({ surface: "push.send-daily", kind: "api", outcome: "error", detail: error.message });
          await flushOps();
          return Response.json({ error: "Could not read devices" }, { status: 500 });
        }

        const due = (data ?? [])
          .map((sub) => ({ sub, local: localNow(sub.timezone, now) }))
          .filter(({ sub, local }) => {
            if (sub.last_sent_day === local.day) return false;
            if (ignoreSchedule) return true;
            if (sub.send_hour !== local.hour) return false;
            // Match the whole 15-minute slot so a slightly late cron run still fires.
            return sub.send_minute === Math.floor(local.minute / 15) * 15;
          });

        let sent = 0;
        let removed = 0;

        for (let i = 0; i < due.length; i += 50) {
          const batch = due.slice(i, i + 50);
          const results = await Promise.all(
            batch.map(async (entry) => ({ ...entry, result: await sendPush(entry.sub.endpoint) })),
          );

          const gone = results.filter((r) => r.result.gone).map((r) => r.sub.id);
          const failed = results.filter((r) => !r.result.ok && !r.result.gone);
          const ok = results.filter((r) => r.result.ok);
          sent += ok.length;
          removed += gone.length;

          if (gone.length) {
            await supabaseAdmin.from("push_subscriptions").delete().in("id", gone);
          }
          for (const entry of ok) {
            await supabaseAdmin
              .from("push_subscriptions")
              .update({
                last_sent_at: now.toISOString(),
                last_sent_day: entry.local.day,
                failure_count: 0,
              })
              .eq("id", entry.sub.id);
          }
          for (const f of failed) {
            const count = (f.sub.failure_count ?? 0) + 1;
            if (count >= 5) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("id", f.sub.id);
              removed += 1;
            } else {
              await supabaseAdmin
                .from("push_subscriptions")
                .update({ failure_count: count })
                .eq("id", f.sub.id);
            }
          }
        }

        recordOps({
          surface: "push.send-daily",
          kind: "api",
          outcome: "ok",
          durationMs: Date.now() - now.getTime(),
          detail: `due=${due.length} sent=${sent} removed=${removed}`,
        });
        await flushOps();

        return Response.json({ ok: true, devices: data?.length ?? 0, due: due.length, sent, removed });
      },
    },
  },
});
