import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapsExplorer, type ExplorerSearch } from "@/components/atlas/MapsExplorer";
import { mapReturn } from "@/lib/atlas/reader-return";
import { SITE_URL as SITE } from "@/lib/site";

export const Route = createFileRoute("/maps/")({
  validateSearch: (raw: Record<string, unknown>): ExplorerSearch => ({
    ...(typeof raw.place === "string" && raw.place ? { place: raw.place } : {}),
    ...(typeof raw.q === "string" && raw.q ? { q: raw.q } : {}),
    ...(typeof raw.journey === "string" && raw.journey ? { journey: raw.journey } : {}),
    ...(typeof raw.leg === "string" && raw.leg ? { leg: raw.leg } : {}),
    ...(Number.isFinite(Number(raw.stop)) && Number(raw.stop) > 0 ? { stop: Math.min(Math.trunc(Number(raw.stop)), 99) } : {}),
    ...(typeof raw.from === "string" && raw.from ? { from: raw.from } : {}),
  }),
  head: () => {
    const title = "Interactive Bible Map | Bible Atlas";
    const description = "Explore biblical places on one terrain map, with nearby locations, Scripture links and journeys.";
    const url = `${SITE}/maps`;
    return { meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:url", content: url }], links: [{ rel: "canonical", href: url }] };
  },
  component: MapsIndex,
});

function MapsIndex() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  return <MapsExplorer initialPlace={search.place} initialQuery={search.q} initialJourney={search.journey} initialLeg={search.leg} initialStop={search.stop} back={search.from ? mapReturn(search.from) : null} updateSearch={(patch) => void navigate({ search: (previous: ExplorerSearch) => ({ ...previous, ...patch }), replace: true })} />;
}