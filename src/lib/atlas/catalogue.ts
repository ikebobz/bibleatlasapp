import { PLACES, MODERN_NAMES, haversineKm, type Place } from "./geo";
import { JOURNEYS, type Journey } from "./journeys";
import { PUBLISHED_PLACES, type Entity } from "@/lib/entities/registry";
import type { CuratedPlace } from "@/lib/entities/copy";

export type LocationCertainty = "known" | "probable" | "possible" | "traditional" | "unknown";
export type MapFeatureKind = "city" | "region" | "mountain" | "water" | "archaeology";

export type MapPassage = {
  reference: string;
  book: string;
  chapter: number;
  verse?: number;
};

export type MapFeature = {
  id: string;
  name: string;
  ancientName?: string;
  modernName?: string;
  aliases: string[];
  lon: number;
  lat: number;
  kind: MapFeatureKind;
  region?: string;
  summary?: string;
  archaeology?: string;
  certainty: LocationCertainty;
  certaintyNote?: string;
  sourceNote: string;
  entitySlug?: string;
  /** Optional known extent; never invented. */
  boundary?: { type: "Polygon"; coordinates: [number, number][][] };
  relatedPlaceIds: string[];
  journeyIds: string[];
  passages: MapPassage[];
};

const ENTITY_SLUG_BY_PLACE_ID: Record<string, string> = {
  sinai: "mount-sinai",
  olives: "mount-of-olives",
  ararat: "mount-ararat",
  "red-sea-crossing": "red-sea",
};

const UNCERTAINTY: Record<string, { certainty: LocationCertainty; note: string }> = {
  eden: { certainty: "unknown", note: "The biblical text names a region; its exact location is unknown." },
  sinai: { certainty: "traditional", note: "Shown at the traditional southern Sinai location; other sites are proposed." },
  sodom: { certainty: "possible", note: "Several Dead Sea sites are proposed; no identification is certain." },
  tarshish: { certainty: "unknown", note: "Shown only as a western direction; the exact destination is disputed." },
  "red-sea-crossing": { certainty: "unknown", note: "The crossing point is illustrative; the exact route is not known." },
  bethabara: { certainty: "possible", note: "The baptism site is approximate and remains debated." },
  golgotha: { certainty: "traditional", note: "The marker represents the traditional area; the exact site is debated." },
  emmaus: { certainty: "possible", note: "Several sites have been proposed for Emmaus." },
  ai: { certainty: "possible", note: "The archaeological identification of biblical Ai remains debated." },
  rephidim: { certainty: "unknown", note: "The wilderness location is approximate." },
  marah: { certainty: "unknown", note: "The wilderness location is approximate." },
  elim: { certainty: "possible", note: "Shown at a commonly proposed oasis area." },
  kadesh: { certainty: "probable", note: "Commonly identified with the oasis region around Tell el-Qudeirat." },
  "jacobs-well": { certainty: "traditional", note: "The long-venerated well near ancient Shechem fits the setting of John 4." },
  "mount-gerizim": { certainty: "known", note: "Mount Gerizim is securely identified above ancient Shechem and modern Nablus." },
  patmos: { certainty: "known", note: "The Aegean island named in Revelation 1 is securely identified." },
  smyrna: { certainty: "known", note: "Ancient Smyrna is securely identified within modern İzmir." },
  pergamum: { certainty: "known", note: "Ancient Pergamum is securely identified at modern Bergama." },
  thyatira: { certainty: "known", note: "Ancient Thyatira is securely identified at modern Akhisar." },
  sardis: { certainty: "known", note: "The archaeological site of Sardis is securely identified near Sart." },
  "philadelphia-asia": { certainty: "known", note: "Ancient Philadelphia is securely identified at modern Alaşehir." },
  laodicea: { certainty: "known", note: "The archaeological site of Laodicea is securely identified near Denizli." },
  paran: { certainty: "possible", note: "Paran names a broad wilderness region; this marker is regional rather than a precise camp." },
  "mount-hor": { certainty: "traditional", note: "Shown at Jabal Harun near Petra; the identification of biblical Mount Hor remains debated." },
  "ezion-geber": { certainty: "probable", note: "Located near the head of the Gulf of Aqaba, though the precise site is debated." },
  "plains-of-moab": { certainty: "known", note: "The broad plains east of the Jordan opposite Jericho are securely located." },
  gilead: { certainty: "known", note: "Gilead is a known Transjordan region; Jacob's precise meeting place within it is not fixed." },
  mahanaim: { certainty: "possible", note: "Mahanaim belongs in the Jabbok region, but its exact archaeological site is disputed." },
  peniel: { certainty: "possible", note: "Peniel lay near the Jabbok crossing; its exact tell is disputed." },
  "succoth-jacob": { certainty: "possible", note: "Jacob's Succoth was east of the Jordan; Tell Deir Alla is one proposed identification." },
};

function entityForPlace(id: string): Entity | undefined {
  const slug = ENTITY_SLUG_BY_PLACE_ID[id] ?? id;
  return PUBLISHED_PLACES.find((entity) => entity.slug === slug);
}

export function mapPlaceIdForEntity(entity: Pick<Entity, "slug" | "name">): string | undefined {
  const direct = Object.values(PLACES).find((place) => place.id === entity.slug);
  if (direct) return direct.id;
  const mapped = Object.entries(ENTITY_SLUG_BY_PLACE_ID).find(([, slug]) => slug === entity.slug)?.[0];
  if (mapped) return mapped;
  const normalized = entity.name.toLowerCase();
  return Object.values(PLACES).find((place) => place.name.toLowerCase() === normalized)?.id;
}

function featureKind(place: Place, archaeology?: string): MapFeatureKind {
  if (archaeology && place.kind !== "region" && place.kind !== "mountain" && place.kind !== "water") {
    return "archaeology";
  }
  return place.kind ?? "city";
}

function relationships(placeId: string) {
  const journeyIds = new Set<string>();
  const related = new Set<string>();
  const passages = new Map<string, MapPassage>();
  for (const journey of JOURNEYS) {
    for (const leg of journey.legs) {
      if (!leg.stops.some((stop) => stop.place === placeId)) continue;
      journeyIds.add(journey.id);
      for (const stop of leg.stops) {
        if (stop.place !== placeId) related.add(stop.place);
        if (stop.place === placeId && stop.ref && stop.link) {
          passages.set(stop.ref, { reference: stop.ref, ...stop.link });
        }
      }
    }
  }
  return {
    journeyIds: [...journeyIds],
    relatedPlaceIds: [...related].slice(0, 8),
    passages: [...passages.values()].slice(0, 4),
  };
}

export const MAP_FEATURES: MapFeature[] = Object.values(PLACES).map((place) => {
  const entity = entityForPlace(place.id);
  const curated = entity?.curated as CuratedPlace | null | undefined;
  const uncertainty = UNCERTAINTY[place.id];
  const relations = relationships(place.id);
  return {
    id: place.id,
    name: entity?.name ?? place.name,
    ancientName: place.name !== entity?.name ? place.name : undefined,
    modernName: curated?.modern ?? MODERN_NAMES[place.id],
    aliases: entity?.aliases ?? [],
    lon: place.lon,
    lat: place.lat,
    kind: featureKind(place, curated?.archaeology),
    region: curated?.region,
    summary: curated?.summary,
    archaeology: curated?.archaeology,
    certainty: uncertainty?.certainty ?? "probable",
    certaintyNote: uncertainty?.note,
    sourceNote: uncertainty
      ? "Approximate historical geography; qualification shown with the location."
      : "Coordinates are for geographic orientation and do not imply archaeological certainty.",
    entitySlug: entity?.slug,
    ...relations,
  };
});

export const MAP_FEATURE_BY_ID: Record<string, MapFeature> = Object.fromEntries(
  MAP_FEATURES.map((feature) => [feature.id, feature]),
);

export const MAP_JOURNEY_BY_ID: Record<string, Journey> = Object.fromEntries(
  JOURNEYS.map((journey) => [journey.id, journey]),
);

export function nearbyFeatures(placeId: string, limit = 5): Array<MapFeature & { distanceKm: number }> {
  const origin = PLACES[placeId];
  if (!origin) return [];
  return MAP_FEATURES.filter((feature) => feature.id !== placeId)
    .map((feature) => ({ ...feature, distanceKm: haversineKm(origin, PLACES[feature.id]) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/** Simplified certainty for display: known / approximate / disputed. */
export function locationCertainty(certainty: LocationCertainty): "known" | "approximate" | "disputed" {
  if (certainty === "known" || certainty === "probable") return "known";
  if (certainty === "possible") return "disputed";
  return "approximate";
}

export function isApproximate(certainty: LocationCertainty): boolean {
  return locationCertainty(certainty) !== "known";
}

export function certaintyLabel(certainty: LocationCertainty): string {
  return {
    known: "Established location",
    probable: "Probable location",
    possible: "Possible location",
    traditional: "Traditional location",
    unknown: "Exact location uncertain",
  }[certainty];
}

export function searchMapCatalogue(query: string): { features: MapFeature[]; journeys: Journey[] } {
  const needle = query.trim().toLowerCase();
  if (!needle) return { features: [], journeys: [] };
  const features = MAP_FEATURES.filter((feature) =>
    [feature.name, feature.ancientName, feature.modernName, feature.region, ...feature.aliases]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(needle)),
  ).slice(0, 8);
  const journeys = JOURNEYS.filter((journey) =>
    [journey.title, journey.tagline, journey.description, ...(journey.aliases || []), ...journey.legs.flatMap((leg) => leg.stops.map((stop) => stop.label ?? PLACES[stop.place]?.name ?? ""))]
      .some((value) => value.toLowerCase().includes(needle)),
  ).slice(0, 4);
  return { features, journeys };
}