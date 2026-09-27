import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { z } from "zod";

import { sendPush } from "@/lib/push/vapid.server";

const Body = z.object({ endpoint: z.string().url().max(1000) });

/** Sends a single push to one already-registered device, for a self-test. */
export const Route = createFileRoute("/api/public/push/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Loaded per request: route modules are client-reachable, so the service-role
        // client must never sit at module scope.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }

        const { data } = await supabaseAdmin
          .from("push_subscriptions")
          .select("endpoint")
          .eq("endpoint", parsed.endpoint)
          .maybeSingle();

        if (!data) return Response.json({ error: "Device is not registered" }, { status: 404 });

        const result = await sendPush(data.endpoint, 60);
        if (result.gone) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
        }
        return Response.json({ ok: result.ok, status: result.status }, { status: result.ok ? 200 : 502 });
      },
    },
  },
});
