import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { resolveDaily, todayKey } from "@/lib/push/daily.server";

function authorised(request: Request) {
  const secret = process.env["PUSH_CRON_SECRET"];
  return Boolean(secret) && request.headers.get("x-cron-secret") === secret;
}

/** Cron: resolve and store today's verse entry. */
export const Route = createFileRoute("/api/public/push/build-daily")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Loaded per request: route modules are client-reachable, so the service-role
        // client must never sit at module scope.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        if (!authorised(request)) return new Response("Unauthorized", { status: 401 });

        const url = new URL(request.url);
        const day = url.searchParams.get("day") ?? todayKey();
        const row = await resolveDaily(day);

        const { error } = await supabaseAdmin
          .from("daily_verse")
          .upsert(row, { onConflict: "day" });
        if (error) return Response.json({ error: "Could not store" }, { status: 500 });

        return Response.json({ ok: true, day, source: row.source, season: row.season });
      },
    },
  },
});
