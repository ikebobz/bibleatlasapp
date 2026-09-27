import { createFileRoute } from "@tanstack/react-router";
import { getAudioChapter } from "@/lib/audio-bible.server";

export const Route = createFileRoute("/api/public/get-audio-chapter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({})) as Record<string, unknown>;
        const result = await getAudioChapter({
          bookSlug: typeof body.bookSlug === "string" ? body.bookSlug : "",
          chapterNumber: body.chapterNumber,
          audioBibleId: body.audioBibleId,
          fresh: body.fresh === true,
        });

        if (!result.ok) {
          return new Response(
            JSON.stringify({ error: result.error, detail: result.detail }),
            {
              status: result.status,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        return new Response(JSON.stringify(result.data), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
