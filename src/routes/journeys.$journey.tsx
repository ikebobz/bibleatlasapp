import { createFileRoute, Link, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { JourneyText } from "@/components/atlas/JourneyText";
import { journeyGraph } from "@/lib/atlas/journey-seo";
import { MapsExplorer, type ExplorerSearch } from "@/components/atlas/MapsExplorer";
import { mapReturn } from "@/lib/atlas/reader-return";
import {
  JOURNEY_BY_ID,
  type Journey,
} from "@/lib/atlas/journeys";
import { fitOnWordBoundary } from "@/lib/share-meta";

import { SITE_URL as SITE } from "@/lib/site";

/** Same shape as /journeys, so the one canonical map behaves identically here. */
type JourneySearch = ExplorerSearch;

export const Route = createFileRoute("/journeys/$journey")({
  // Keep empty params out of the URL so /journeys/<journey> stays the canonical URL.
  validateSearch: (raw: Record<string, unknown>): JourneySearch => ({
    ...(typeof raw.place === "string" && raw.place ? { place: raw.place } : {}),
    ...(typeof raw.leg === "string" && raw.leg ? { leg: raw.leg } : {}),
    ...(Number.isFinite(Number(raw.stop)) && Number(raw.stop) > 0
      ? { stop: Math.min(Math.trunc(Number(raw.stop)), 99) }
      : {}),
    ...(typeof raw.from === "string" && raw.from ? { from: raw.from } : {}),
  }),
  // Old `?leg=first` links move permanently to the leg's own page. Server only,
  // so switching legs inside the open map doesn't remount it.
  beforeLoad: ({ params, search }) => {
    if (typeof window !== "undefined" || !search.leg) return;
    const journey = JOURNEY_BY_ID[params.journey];
    if (!journey || journey.legs.length < 2 || !journey.legs.some((l) => l.id === search.leg)) return;
    const { leg, ...rest } = search;
    const qs = new URLSearchParams(
      Object.entries(rest).map(([k, v]) => [k, String(v)]),
    ).toString();
    throw redirect({ href: `/journeys/${journey.id}/${leg}${qs ? `?${qs}` : ""}`, statusCode: 301 });
  },
  loader: ({ params }) => {
    const journey = JOURNEY_BY_ID[params.journey];
    if (!journey) throw notFound();
    return { journey };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Map not found — Bible Atlas" }, { name: "robots", content: "noindex" }],
      };
    }
    const { journey } = loaderData;
    const url = `${SITE}/journeys/${params.journey}`;
    const title = fitOnWordBoundary(`${journey.title} Map & Route | Bible Atlas`, 60);
    const description = fitOnWordBoundary(journey.description, 160);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: journeyGraph({
            journey,
            legs: journey.legs,
            url,
            name: journey.title,
            description: journey.description,
            crumbs: [
              { name: "Bible Atlas", item: SITE },
               { name: "Journeys", item: `${SITE}/journeys` },
              { name: journey.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: JourneyPage,
  notFoundComponent: JourneyNotFound,
});

function JourneyNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="scripture text-2xl text-foreground">That journey doesn’t exist</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Pick one of the interactive journeys instead.
        </p>
        <Link
          to="/journeys"
          className="mt-6 inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          All journeys
        </Link>
      </div>
    </main>
  );
}

function JourneyPage() {
  const { journey } = Route.useLoaderData() as { journey: Journey };
  const { place, leg: legParam, stop, from } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <>
    <MapsExplorer
      initialPlace={place}
      initialJourney={journey.id}
      initialLeg={legParam ?? journey.legs[0].id}
      initialStop={stop}
      back={from ? mapReturn(from) : null}
      updateSearch={(patch) =>
        void navigate({ search: (prev: JourneySearch) => ({ ...prev, ...patch }), replace: true })
      }
      // Switching journeys changes the path here, not a search param.
      onJourneyChange={(id) =>
        void navigate({ to: "/journeys/$journey", params: { journey: id }, search: from ? { from } : {} })
      }
    />
        <JourneyText
      journey={journey}
      leg={journey.legs.find((l) => l.id === legParam) ?? journey.legs[0]}
      activeStop={stop}
      onStopSelect={(index) => navigate({ search: (prev) => ({ ...prev, stop: index || undefined }), replace: true })}
    />
    </>
  );
}
