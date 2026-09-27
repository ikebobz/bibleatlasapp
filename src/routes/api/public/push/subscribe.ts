import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { z } from "zod";

import { TRANSLATION_IDS } from "@/lib/translations";

const Body = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(200) }),
  translation: z.enum(TRANSLATION_IDS).optional(),
  timezone: z.string().max(80).optional(),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z
    .number()
    .int()
    .refine((m) => [0, 15, 30, 45].includes(m), "Minute must fall on a quarter hour")
    .optional(),
});

export const Route = createFileRoute("/api/public/push/subscribe")({
  server: {
    handlers: {
      // Read-only existence check used by the in-app diagnostics modal.
      GET: async ({ request }) => {
        // Loaded per request: route modules are client-reachable, so the service-role
        // client must never sit at module scope.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const endpoint = new URL(request.url).searchParams.get("endpoint") ?? "";
        const valid = z.string().url().max(1000).safeParse(endpoint);
        if (!valid.success) return Response.json({ error: "Invalid endpoint" }, { status: 400 });
        try {
          const { data, error } = await supabaseAdmin
            .from("push_subscriptions")
            .select("endpoint")
            .eq("endpoint", valid.data)
            .maybeSingle();
          if (error) throw error;
          return Response.json({ registered: Boolean(data) });
        } catch {
          return Response.json(
            { error: "Could not reach notification storage", code: "storage_unavailable" },
            { status: 503 },
          );
        }
      },
      POST: async ({ request }) => {
        // Loaded per request: route modules are client-reachable, so the service-role
        // client must never sit at module scope.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let parsed;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return Response.json({ error: "Invalid subscription" }, { status: 400 });
        }

        let error;
        try {
          const result = await supabaseAdmin.from("push_subscriptions").upsert(
            {
              endpoint: parsed.endpoint,
              p256dh: parsed.keys.p256dh,
              auth: parsed.keys.auth,
              translation: parsed.translation ?? "kjv",
              timezone: parsed.timezone?.trim() || "UTC",
              send_hour: parsed.hour ?? 7,
              send_minute: parsed.minute ?? 0,
              user_agent: (request.headers.get("user-agent") ?? "").slice(0, 300),
              failure_count: 0,
            },
            { onConflict: "endpoint" },
          );
          error = result.error;
        } catch {
          return Response.json(
            { error: "Could not reach notification storage", code: "storage_unavailable" },
            { status: 503 },
          );
        }

        if (error) {
          console.error("Push subscription upsert failed", { code: error.code });
          return Response.json(
            { error: "Could not save this device", code: error.code || "save_failed" },
            { status: 500 },
          );
        }
        return Response.json({ ok: true });
      },
    },
  },
});
