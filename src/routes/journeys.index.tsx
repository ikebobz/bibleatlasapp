import { createFileRoute } from "@tanstack/react-router";
import { JourneyLibrary } from "@/components/atlas/JourneyLibrary";
import { JOURNEYS } from "@/lib/atlas/journeys";
import { SITE_URL as SITE } from "@/lib/site";

export const Route = createFileRoute("/journeys/")({
  head: () => {
    const title = "Bible Journeys — Interactive Scripture Maps | Bible Atlas";
    const description = "Follow eleven Bible journeys through real geography, animated routes, ordered events and Scripture-linked stops.";
    const url = `${SITE}/journeys`;
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify({
        "@context": "https://schema.org", "@type": "CollectionPage", name: title, description, url,
        hasPart: JOURNEYS.map((journey) => ({ "@type": "CreativeWork", name: journey.title, description: journey.description, url: `${SITE}/journeys/${journey.id}` })),
      }) }],
    };
  },
  component: JourneyLibrary,
});