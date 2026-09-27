import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { ChapterReader } from "@/components/reader/ChapterReader";
import { chapterQuery } from "@/lib/chapter-query";
import { lastPosition } from "@/components/reader/settings";
import { SITE_URL as SITE } from "@/lib/site";
import { homeStructuredData } from "@/lib/structured-data";


export const Route = createFileRoute("/")({
  validateSearch: z.object({ ref: z.string().optional() }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(chapterQuery("genesis", 1));
  },
  // The homepage describes itself rather than inheriting the sitewide defaults.
  head: () => {
    const title = "Bible Atlas — Read the Bible with Maps, Timelines & Context";
    const description =
      "Read the whole Bible free online with interactive maps, timelines, family trees, 3D artefacts and thematic connections beside every verse.";
    const image = `${SITE}/og/default-card.jpg`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: `${SITE}/` },
        { property: "og:type", content: "website" },
        { property: "og:image", content: image },
        { property: "og:image:alt", content: "Bible Atlas — read the Bible with context & maps" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: `${SITE}/` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(homeStructuredData({ title, description, image })),
        },
      ],
    };
  },

  component: Index,
  errorComponent: HomeUnavailable,
});

function HomeUnavailable() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">
        Scripture didn’t load — you may be offline. Reconnect and refresh, or open a chapter you
        have already saved.
      </p>
    </div>
  );
}


function Index() {
  const navigate = useNavigate();
  const { ref } = Route.useSearch();

  useEffect(() => {
    const pos = lastPosition();
    if (pos && !(pos.book === "genesis" && pos.chapter === 1)) {
      navigate({
        to: "/$book/$chapter",
        params: { book: pos.book, chapter: String(pos.chapter) },
        replace: true,
      });
    }
  }, [navigate]);

  return <ChapterReader book="genesis" chapter={1} initialRef={ref} />;
}
