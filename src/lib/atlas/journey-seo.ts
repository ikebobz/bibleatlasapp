/**
 * Search metadata and structured data for journey and journey-leg pages.
 * Everything is derived from the existing journey data — nothing is invented.
 */
import { PLACES } from "./geo";
import { legDistances, versePath, type Journey, type JourneyLeg, type JourneyStop } from "./journeys";
import { entityByName, entityBySlug, entityPath } from "@/lib/entities/registry";
import { fitOnWordBoundary } from "@/lib/share-meta";
import { SITE_URL as SITE } from "@/lib/site";

export function stopName(stop: JourneyStop): string {
  return stop.label ?? PLACES[stop.place]?.name ?? stop.place;
}

/** Published place page for a stop, if one exists. */
export function stopPlacePath(stop: JourneyStop): string | null {
  const name = PLACES[stop.place]?.name ?? stop.place;
  const e = entityBySlug("place", stop.place) ?? entityByName(name.replace(/\s*\(.*\)$/, ""));
  return e && e.published && e.type === "place" ? entityPath(e) : null;
}

const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

/** "Paul's First Missionary Journey" from journey "Paul's Missionary Journeys" + leg "First missionary journey". */
export function legHeading(journey: Journey, leg: JourneyLeg): string {
  const owner = journey.title.split(" ")[0];
  return owner.endsWith("'s") ? `${owner} ${titleCase(leg.name)}` : `${journey.title}: ${titleCase(leg.name)}`;
}

export function legPath(journey: Journey, leg: JourneyLeg): string {
  return journey.legs.length > 1 ? `/journeys/${journey.id}/${leg.id}` : `/journeys/${journey.id}`;
}

export function legDescription(journey: Journey, leg: JourneyLeg): string {
  const names = leg.stops.map(stopName);
  const km = Math.round(legDistances(leg.stops, leg.bySea).at(-1) ?? 0);
  return fitOnWordBoundary(
    `Map of ${legHeading(journey, leg)} (${leg.short}): ${leg.stops.length} stops from ${names[0]} to ${names.at(-1)}, about ${km.toLocaleString("en")} km, with the Bible passage behind every stop.`,
    160,
  );
}

export function journeyGraph(opts: {
  journey: Journey;
  legs: JourneyLeg[];
  url: string;
  name: string;
  description: string;
  crumbs: { name: string; item: string }[];
}) {
  const stops = opts.legs.flatMap((l) => l.stops);
  const seen = new Set<string>();
  const about = stops
    .filter((s) => (seen.has(s.place) ? false : (seen.add(s.place), true)))
    .flatMap((s) => {
      const p = PLACES[s.place];
      if (!p) return [];
      const path = stopPlacePath(s);
      return [
        {
          "@type": "Place",
          name: p.name,
          geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lon },
          ...(path ? { url: `${SITE}${path}` } : {}),
        },
      ];
    });
  const citation = [...new Set(stops.map((s) => s.ref).filter(Boolean) as string[])].map((ref) => {
    const stop = stops.find((s) => s.ref === ref)!;
    const path = versePath(stop.link);
    return { "@type": "CreativeWork", name: ref, ...(path ? { url: `${SITE}${path}` } : {}) };
  });
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: opts.name,
        description: opts.description,
        url: opts.url,
        inLanguage: "en",
        temporalCoverage: opts.journey.era,
        isPartOf: { "@type": "WebSite", name: "Bible Atlas", url: SITE },
        about,
        citation,
        mainEntity: {
          "@type": "ItemList",
          name: `${opts.name} — stops`,
          itemListElement: stops.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: stopName(s) })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: opts.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })),
      },
    ],
  });
}
