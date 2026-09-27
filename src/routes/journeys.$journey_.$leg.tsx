import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { MapsExplorer, type ExplorerSearch } from "@/components/atlas/MapsExplorer";
import { JourneyText } from "@/components/atlas/JourneyText";
import { mapReturn } from "@/lib/atlas/reader-return";
import { JOURNEY_BY_ID, type Journey, type JourneyLeg } from "@/lib/atlas/journeys";
import { journeyGraph, legDescription, legHeading } from "@/lib/atlas/journey-seo";
import { fitOnWordBoundary } from "@/lib/share-meta";
import { SITE_URL as SITE } from "@/lib/site";

type LegSearch = Omit<ExplorerSearch, "leg">;

/** One leg of a multi-leg journey, e.g. /journeys/paul/first. */
export const Route = createFileRoute("/journeys/$journey_/$leg")({
  validateSearch: (raw: Record<string, unknown>): LegSearch => ({
    ...(typeof raw.place === "string" && raw.place ? { place: raw.place } : {}),
    ...(Number.isFinite(Number(raw.stop)) && Number(raw.stop) > 0
      ? { stop: Math.min(Math.trunc(Number(raw.stop)), 99) }
      : {}),
    ...(typeof raw.from === "string" && raw.from ? { from: raw.from } : {}),
  }),
  loader: ({ params }) => {
    const journey = JOURNEY_BY_ID[params.journey];
    const leg = journey && journey.legs.length > 1 ? journey.legs.find((l) => l.id === params.leg) : undefined;
    if (!journey || !leg) throw notFound();
    return { journey, leg };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Map not found — Bible Atlas" }, { name: "robots", content: "noindex" }] };
    }
    const { journey, leg } = loaderData;
    const url = `${SITE}/journeys/${journey.id}/${leg.id}`;
    const name = `${legHeading(journey, leg)} Map`;
    const title = fitOnWordBoundary(`${name} — ${leg.short} | Bible Atlas`, 65);
    const description = legDescription(journey, leg);
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
            legs: [leg],
            url,
            name,
            description,
            crumbs: [
              { name: "Bible Atlas", item: SITE },
              { name: "Maps", item: `${SITE}/journeys` },
              { name: journey.title, item: `${SITE}/journeys/${journey.id}` },
              { name: legHeading(journey, leg), item: url },
            ],
          }),
        },
      ],
    };
  },
  component: LegPage,
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="scripture text-2xl text-foreground">That map doesn’t exist</h1>
        <Link to="/journeys" className="mt-6 inline-flex min-h-11 items-center rounded-full border px-4 text-sm text-foreground hover:bg-muted">
          All journeys
        </Link>
      </div>
    </main>
  ),
});

function LegPage() {
  const { journey, leg } = Route.useLoaderData() as { journey: Journey; leg: JourneyLeg };
  const { place, stop, from } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <>
      <MapsExplorer
        key={leg.id}
        initialPlace={place}
        initialJourney={journey.id}
        initialLeg={leg.id}
        initialStop={stop}
        back={from ? mapReturn(from) : null}
        updateSearch={(patch) => {
          const { leg: nextLeg, ...rest } = patch as ExplorerSearch;
          if (nextLeg && nextLeg !== leg.id) {
            void navigate({
              to: "/journeys/$journey/$leg",
              params: { journey: journey.id, leg: nextLeg },
              search: from ? { from } : {},
              replace: true,
              resetScroll: false,
            });
            return;
          }
          void navigate({
            to: ".",
            search: (prev: LegSearch) => ({ ...prev, ...rest }),
            replace: true,
          });
        }}
        onJourneyChange={(id) =>
          void navigate({ to: "/journeys/$journey", params: { journey: id }, search: from ? { from } : {} })
        }
      />
      <JourneyText journey={journey} leg={leg} activeStop={stop} onStopSelect={(index) => navigate({ to: ".", search: { ...(place ? { place } : {}), ...(from ? { from } : {}), ...(index ? { stop: index } : {}) }, replace: true })} />
    </>
  );
}
