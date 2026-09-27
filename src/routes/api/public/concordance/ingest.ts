import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/**
 * Ops-only endpoint that loads the KJV text into the concordance index.
 * Guarded by a shared secret; safe to re-run (rows are upserted).
 */
function authorised(request: Request) {
  const secret = process.env["CONCORDANCE_INGEST_SECRET"] ?? process.env["PUSH_CRON_SECRET"];
  return Boolean(secret) && request.headers.get("x-cron-secret") === secret;
}

export const Route = createFileRoute("/api/public/concordance/ingest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!authorised(request)) return new Response("Unauthorized", { status: 401 });
        const { ingestStatus } = await import("@/lib/concordance/ingest.server");
        return Response.json(await ingestStatus());
      },
      POST: async ({ request }) => {
        if (!authorised(request)) return new Response("Unauthorized", { status: 401 });
        const url = new URL(request.url);
        const from = Number(url.searchParams.get("from") ?? "1");
        const to = Number(url.searchParams.get("to") ?? String(from));
        if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to > 66 || to < from) {
          return Response.json({ error: "from/to must be 1–66" }, { status: 400 });
        }

        const { ingestBook } = await import("@/lib/concordance/ingest.server");
        const done: { book: string; inserted: number }[] = [];
        for (let n = from; n <= to; n++) done.push(await ingestBook(n));
        return Response.json({ ok: true, books: done });
      },
    },
  },
});
