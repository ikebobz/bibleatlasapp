import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { z } from "zod";


const Body = z.object({
  endpoint: z.string().url().max(1000),
  // The browser push auth secret proves control of this exact subscription.
  auth: z.string().min(16).max(200),
});

export const Route = createFileRoute("/api/public/push/unsubscribe")({
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

        const { error } = await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", parsed.endpoint)
          .eq("auth", parsed.auth);
        if (error) {
          console.error("Push subscription removal failed", { code: error.code });
          return Response.json({ error: "Could not disable notifications" }, { status: 503 });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
