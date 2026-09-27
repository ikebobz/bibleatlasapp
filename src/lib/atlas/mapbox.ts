/** Mapbox configuration and pure GeoJSON helpers for the real-geography atlas. */

import { PLACES } from "./geo";
import { routePath, routeSegments } from "./corridors";
import type { RouteStop } from "./types";
import type { JourneyComparisonRoute } from "./journeys";
import { MAP_FEATURE_BY_ID, isApproximate } from "./catalogue";

/** Mapbox public token (pk.*); safe to ship in the browser bundle.
 *  Restrict it to mybibleatlas.com in the Mapbox dashboard for hardening. */
export const MAPBOX_TOKEN =
  (import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN as string | undefined) ?? "";

/** True when a usable Mapbox public token is configured. */
export const hasMapbox = MAPBOX_TOKEN.startsWith("pk.");

export type MapStyleId = "outdoors" | "satellite" | "terrain";

export const MAP_STYLES: Record<MapStyleId, { label: string; url: string }> = {
  outdoors: { label: "Topographic", url: "mapbox://styles/mapbox/outdoors-v12" },
  satellite: { label: "Satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
  terrain: { label: "Terrain 3D", url: "mapbox://styles/mapbox/outdoors-v12" },
};

export const MAP_STYLE_IDS = Object.keys(MAP_STYLES) as MapStyleId[];

/** Raster DEM source used for the 3D terrain style. */
export const TERRAIN_DEM = {
  type: "raster-dem" as const,
  url: "mapbox://mapbox.mapbox-terrain-dem-v1",
  tileSize: 512,
  maxzoom: 14,
};

export type AtlasFeature = {
  type: "Feature";
  geometry:
    | { type: "Point"; coordinates: [number, number] }
    | { type: "LineString"; coordinates: [number, number][] }
    | { type: "Polygon"; coordinates: [number, number][][] };
  properties: Record<string, string | number>;
};

export type AtlasFeatureCollection = { type: "FeatureCollection"; features: AtlasFeature[] };

function partialPath(path: [number, number][], progress: number): [number, number][] {
  if (path.length < 2 || progress >= 1) return path;
  if (progress <= 0) return [];
  const lengths = path.slice(1).map((point, index) => {
    const a = path[index];
    const lon = point[0] - a[0];
    const lat = point[1] - a[1];
    return Math.hypot(lon, lat);
  });
  const target = lengths.reduce((sum, value) => sum + value, 0) * progress;
  const result: [number, number][] = [path[0]];
  let travelled = 0;
  for (let index = 0; index < lengths.length; index++) {
    const next = travelled + lengths[index];
    if (target >= next) {
      result.push(path[index + 1]);
      travelled = next;
      continue;
    }
    const amount = lengths[index] ? (target - travelled) / lengths[index] : 0;
    const a = path[index];
    const b = path[index + 1];
    result.push([a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount]);
    break;
  }
  return result;
}

/** Route line + numbered stop points for a journey leg. */
export function routeGeoJSON(
  stops: RouteStop[],
  progress = 0,
  comparisons: JourneyComparisonRoute[] = [],
): AtlasFeatureCollection {
  const ids = stops.map((stop) => stop.place).filter((id) => Boolean(PLACES[id]));
  const features: AtlasFeature[] = [];
  for (const comparison of comparisons) {
    if (comparison.geometry.length < 2) continue;
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: comparison.geometry },
      properties: {
        role: "comparison-route",
        id: comparison.id,
        label: comparison.name,
        status: comparison.status,
      },
    });
    for (const placeId of comparison.supportingPlaceIds) {
      const place = PLACES[placeId];
      if (!place) continue;
      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [place.lon, place.lat] },
        properties: {
          role: "comparison-place",
          place: place.id,
          label: place.name,
        },
      });
    }
  }
  const segments = routeSegments(ids);
  for (const segment of segments) {
    const travelledAmount = Math.min(1, Math.max(0, progress - segment.index));
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: segment.geometry },
      properties: {
        role: "route",
        index: segment.index,
        mode: segment.mode,
        accuracy: segment.accuracy,
        state: "future",
      },
    });
    const travelledGeometry = partialPath(segment.geometry, travelledAmount);
    if (travelledGeometry.length > 1) {
      features.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: travelledGeometry },
        properties: {
          role: "route",
          index: segment.index,
          mode: segment.mode,
          accuracy: segment.accuracy,
          state: "travelled",
        },
      });
    }
  }
  stops.forEach((stop, index) => {
    const place = PLACES[stop.place];
    if (!place) return;
    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [place.lon, place.lat] },
      properties: {
        role: "stop",
        index,
        active: index <= Math.floor(progress) ? 1 : 0,
        current: index === Math.round(progress) ? 1 : 0,
        place: place.id,
        label: stop.label ?? place.name,
      },
    });
  });
  return { type: "FeatureCollection", features };
}

/** Bounding box from every sampled route coordinate, including intermediate waypoints. */
export function routeBounds(stops: RouteStop[]): [[number, number], [number, number]] | null {
  const coordinates = routePath(stops.map((stop) => stop.place).filter((id) => Boolean(PLACES[id])));
  return coordinatesBounds(coordinates);
}

/** Bounds that include the primary sampled route and every contextual comparison. */
export function combinedRouteBounds(
  stops: RouteStop[],
  comparisons: JourneyComparisonRoute[] = [],
): [[number, number], [number, number]] | null {
  const primary = routePath(stops.map((stop) => stop.place).filter((id) => Boolean(PLACES[id])));
  return coordinatesBounds([...primary, ...comparisons.flatMap((comparison) => comparison.geometry)]);
}

export function segmentBounds(stops: RouteStop[], destinationIndex: number): [[number, number], [number, number]] | null {
  if (destinationIndex <= 0) return stopsBounds(stops.slice(0, 1));
  const ids = stops.map((stop) => stop.place).filter((id) => Boolean(PLACES[id]));
  return coordinatesBounds(routeSegments(ids)[destinationIndex - 1]?.geometry ?? []);
}

function coordinatesBounds(coordinates: [number, number][]): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lon, lat] of coordinates) {
    west = Math.min(west, lon);
    south = Math.min(south, lat);
    east = Math.max(east, lon);
    north = Math.max(north, lat);
  }
  return [[west, south], [east, north]];
}

export type CameraPadding = { top: number; bottom: number; left: number; right: number };

export function responsiveCameraPadding(width: number, height: number, overlays?: Partial<CameraPadding>): CameraPadding {
  const compact = width < 640;
  return {
    top: Math.max(overlays?.top ?? 0, compact ? 84 : 104),
    bottom: Math.max(overlays?.bottom ?? 0, compact ? Math.min(210, height * 0.34) : 150),
    left: Math.max(overlays?.left ?? 0, compact ? 18 : 48),
    right: Math.max(overlays?.right ?? 0, compact ? 18 : 48),
  };
}

/** Fixed, accessible palette for place areas; index 0 is reserved for the selected place. */
export const PLACE_AREA_PALETTE = ["#b4532a", "#2f6f8f", "#5b7f3a", "#8a5a9e", "#a07a1f", "#3f6a6a"];

/** Approximate circle (default 1 km) as a closed polygon ring. */
export function circlePolygon(lon: number, lat: number, radiusKm = 1, steps = 64): [number, number][][] {
  const ring: [number, number][] = [];
  const dLat = radiusKm / 110.574;
  const dLon = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([lon + dLon * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return [ring];
}

/** Marker points for standalone places, plus an area (boundary or approximate circle) for the selected place. */
export function placesGeoJSON(placeIds: string[], selectedPlace?: string | null): AtlasFeatureCollection {
  const places = placeIds.map((id) => PLACES[id]).filter(Boolean);
  const areas: AtlasFeature[] = [];
  let colorIndex = 1;
  for (const place of places) {
    const feature = MAP_FEATURE_BY_ID[place.id];
    const selected = place.id === selectedPlace;
    if (!selected && !feature?.boundary) continue;
    const color = selected ? PLACE_AREA_PALETTE[0] : PLACE_AREA_PALETTE[colorIndex++ % PLACE_AREA_PALETTE.length || 1];
    areas.push({
      type: "Feature",
      geometry: feature?.boundary ?? { type: "Polygon", coordinates: circlePolygon(place.lon, place.lat) },
      properties: {
        role: "place-area",
        place: place.id,
        selected: selected ? 1 : 0,
        color,
        estimated: feature?.boundary ? 0 : 1,
        approximate: feature && isApproximate(feature.certainty) ? 1 : 0,
      },
    });
  }
  const points = places.map((place) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [place.lon, place.lat] as [number, number] },
    properties: {
      role: "place",
      place: place.id,
      label: place.name,
      selected: place.id === selectedPlace ? 1 : 0,
    },
  }));
  return { type: "FeatureCollection", features: [...areas, ...points] };
}

/** Bounding box [[west, south], [east, north]] for a set of stops, or null when empty. */
export function stopsBounds(stops: RouteStop[]): [[number, number], [number, number]] | null {
  const points = stops.map((stop) => PLACES[stop.place]).filter(Boolean);
  if (points.length === 0) return null;
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const point of points) {
    west = Math.min(west, point.lon);
    south = Math.min(south, point.lat);
    east = Math.max(east, point.lon);
    north = Math.max(north, point.lat);
  }
  return [
    [west, south],
    [east, north],
  ];
}

/** Bounding box for standalone place ids, or null when empty. */
export function placesBounds(placeIds: string[]): [[number, number], [number, number]] | null {
  return stopsBounds(placeIds.map((place) => ({ place })));
}

export const ATLAS_SOURCE_ID = "bible-atlas";
export const ATLAS_DEM_SOURCE_ID = "bible-atlas-dem";

type StyleSpec = {
  sources: Record<string, unknown>;
  layers: Array<Record<string, unknown>>;
  terrain?: unknown;
};

/** Journey line, stop markers and labels, declared as style layers. */
export function atlasLayers(colors: { route: string; comparison: string; ink: string; paper: string }) {
  return [
    {
      id: "atlas-comparison-route",
      type: "line",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "comparison-route"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": colors.comparison,
        "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.75, 8, 2.5],
        "line-opacity": 0.68,
        "line-dasharray": [2, 2.5],
      },
    },
    {
      id: "atlas-route-casing",
      type: "line",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "route"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": colors.paper, "line-width": 6, "line-opacity": 0.72 },
    },
    {
      id: "atlas-comparison-place",
      type: "circle",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "comparison-place"],
      paint: {
        "circle-radius": 4,
        "circle-color": colors.paper,
        "circle-stroke-color": colors.comparison,
        "circle-stroke-width": 1.5,
        "circle-opacity": 0.82,
      },
    },
    {
      id: "atlas-comparison-place-label",
      type: "symbol",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "comparison-place"],
      layout: {
        "text-field": ["get", "label"],
        "text-size": 11,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-optional": true,
      },
      paint: { "text-color": colors.comparison, "text-halo-color": colors.paper, "text-halo-width": 1.4 },
    },
    {
      id: "atlas-route",
      type: "line",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "route"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": colors.route,
        "line-width": ["case", ["==", ["get", "state"], "travelled"], 3.5, 2.25],
        "line-opacity": ["case", ["==", ["get", "state"], "travelled"], 0.95, 0.38],
        "line-dasharray": ["case", ["==", ["get", "mode"], "maritime"], [2, 2], [1, 0]],
      },
    },
    {
      id: "atlas-place-area-fill",
      type: "fill",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "place-area"],
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": ["case", ["==", ["get", "estimated"], 1], 0.1, ["==", ["get", "selected"], 1], 0.2, 0.14],
      },
    },
    {
      id: "atlas-place-area-line",
      type: "line",
      source: ATLAS_SOURCE_ID,
      filter: ["all", ["==", ["get", "role"], "place-area"], ["!=", ["get", "approximate"], 1]],
      paint: { "line-color": ["get", "color"], "line-width": ["case", ["==", ["get", "selected"], 1], 2, 1.5], "line-opacity": 0.85 },
    },
    {
      id: "atlas-place-area-line-approx",
      type: "line",
      source: ATLAS_SOURCE_ID,
      filter: ["all", ["==", ["get", "role"], "place-area"], ["==", ["get", "approximate"], 1]],
      paint: { "line-color": ["get", "color"], "line-width": 2, "line-opacity": 0.85, "line-dasharray": [2, 2] },
    },
    {
      id: "atlas-places",
      type: "circle",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "place"],
      paint: {
        "circle-radius": ["case", ["==", ["get", "selected"], 1], 10, 6],
        "circle-color": ["case", ["==", ["get", "selected"], 1], colors.route, colors.paper],
        "circle-stroke-color": colors.route,
        "circle-stroke-width": 2,
      },
    },
    {
      id: "atlas-place-labels",
      type: "symbol",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "place"],
      layout: {
        "text-field": ["get", "label"],
        "text-size": ["case", ["==", ["get", "selected"], 1], 14, 11],
        "text-offset": [1, 0],
        "text-anchor": "left",
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-optional": true,
        "symbol-sort-key": ["case", ["==", ["get", "selected"], 1], 0, 1],
      },
      paint: { "text-color": colors.ink, "text-halo-color": colors.paper, "text-halo-width": 2 },
    },
    {
      id: "atlas-stops",
      type: "circle",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "stop"],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, ["case", ["==", ["get", "current"], 1], 10, 5], 8, ["case", ["==", ["get", "current"], 1], 10, 8]],
        "circle-color": ["case", ["==", ["get", "active"], 1], colors.route, colors.paper],
        "circle-stroke-color": colors.paper,
        "circle-stroke-width": 2.5,
      },
    },
    {
      id: "atlas-stop-labels",
      type: "symbol",
      source: ATLAS_SOURCE_ID,
      filter: ["==", ["get", "role"], "stop"],
      layout: {
        "text-field": ["get", "label"],
        "text-size": 12,
        "text-offset": [0, 1.4],
        "text-anchor": "top",
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-optional": true,
      },
      paint: { "text-color": colors.ink, "text-halo-color": colors.paper, "text-halo-width": 1.6 },
    },
  ] as Array<Record<string, unknown>>;
}

/** HTTP form of a mapbox:// style URL, so the style JSON can be fetched (and cached). */
export function styleJsonUrl(styleId: MapStyleId): string {
  const path = MAP_STYLES[styleId].url.replace("mapbox://styles/", "https://api.mapbox.com/styles/v1/");
  return `${path}?access_token=${MAPBOX_TOKEN}`;
}

/**
 * Cached raw style documents. Each style is fetched at most once per visit
 * (and served from the offline cache on repeat visits), so switching surfaces
 * or re-entering /maps costs no extra style requests.
 */
const styleCache = new Map<MapStyleId, StyleSpec>();

async function rawStyle(styleId: MapStyleId): Promise<StyleSpec> {
  const cached = styleCache.get(styleId);
  if (cached) return structuredClone(cached);
  const response = await fetch(styleJsonUrl(styleId), { cache: "force-cache" });
  if (!response.ok) throw new Error(`style ${response.status}`);
  const style = (await response.json()) as StyleSpec;
  styleCache.set(styleId, style);
  return structuredClone(style);
}

/**
 * Fetch a Mapbox style and merge the journey layers into it, so the route is
 * painted on the very first frame instead of being added after a load event.
 */
export async function buildAtlasStyle(
  styleId: MapStyleId,
  data: AtlasFeatureCollection,
  colors: { route: string; comparison: string; ink: string; paper: string },
): Promise<StyleSpec> {
  const style = await rawStyle(styleId);

  style.sources = { ...style.sources, [ATLAS_SOURCE_ID]: { type: "geojson", data } };
  style.layers = [...style.layers, ...atlasLayers(colors)];
  if (styleId === "terrain") {
    style.sources[ATLAS_DEM_SOURCE_ID] = TERRAIN_DEM;
    style.terrain = { source: ATLAS_DEM_SOURCE_ID, exaggeration: 1.35 };
  } else {
    delete style.terrain;
  }
  return style;
}

