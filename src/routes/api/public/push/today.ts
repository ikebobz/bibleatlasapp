import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { renderDaily, resolveDaily, todayKey, type DailyVerseRow } from "@/lib/push/daily.server";

/** Today's verse, rendered in the requested public-domain translation. */
export const Route = createFileRoute("/api/public/push/today")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Loaded per request: route modules are client-reachable, so the service-role
        // client must never sit at module scope.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const url = new URL(request.url);
        const day = url.searchParams.get("day") ?? todayKey();
        const translation = url.searchParams.get("v") ?? undefined;

        const { data } = await supabaseAdmin
          .from("daily_verse")
          .select("*")
          .eq("day", day)
          .maybeSingle();

        const row = (data as DailyVerseRow | null) ?? ((await resolveDaily(day)) as DailyVerseRow);
        const payload = await renderDaily(row, translation);

        return Response.json(payload, {
          headers: { "cache-control": "public, max-age=300" },
        });
      },
    },
  },
});
