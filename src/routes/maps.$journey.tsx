import { createFileRoute, redirect } from "@tanstack/react-router";
import { JOURNEY_BY_ID } from "@/lib/atlas/journeys";
import { SITE_URL as SITE } from "@/lib/site";

function queryString(search: Record<string, unknown>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string" || typeof value === "number") params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : "";
}

export const Route = createFileRoute("/maps/$journey")({
  validateSearch: (search: Record<string, unknown>) => search,
  head: ({ params }) => {
    const journey = JOURNEY_BY_ID[params.journey];
    const name = journey?.title ?? "Bible journey";
    const title = `${name} — Journey Map | Bible Atlas`;
    const description = journey?.description ?? "Follow this Bible journey on an interactive map with Scripture-linked stops.";
    const url = `${SITE}${`/journeys/${params.journey}`}`;
    const image = `${SITE}/og/default-card.jpg`;
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "article" }, { property: "og:url", content: url },
        { property: "og:image", content: image }, { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  beforeLoad: ({ params, search }) => {
    throw redirect({ href: `/journeys/${params.journey}${queryString(search)}`, statusCode: 301 });
  },
});
