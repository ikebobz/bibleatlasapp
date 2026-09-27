import { describe, expect, it } from "vitest";
import { PLACES, haversineKm } from "./geo";
import { corridorFor, pathLengthKm, pointAlongPath, routePath, routeSegments, segmentDistanceKm, segmentPath } from "./corridors";
import { JOURNEY_BY_ID, journeySegments, totalDistanceKm } from "./journeys";

describe("corridors", () => {
  it("keeps the exact endpoints of a curated segment", () => {
    const path = segmentPath("ur", "haran");
    expect(path[0]).toEqual([PLACES.ur.lon, PLACES.ur.lat]);
    expect(path.at(-1)).toEqual([PLACES.haran.lon, PLACES.haran.lat]);
    expect(path.length).toBeGreaterThan(10);
  });

  it("reuses a curated corridor in the reverse direction", () => {
    const forward = corridorFor("ur", "haran");
    const back = corridorFor("haran", "ur");
    expect(back?.via).toEqual([...(forward?.via ?? [])].reverse());
  });

  it("falls back cleanly when no corridor is curated", () => {
    const path = segmentPath("jerusalem", "bethlehem");
    expect(path).toHaveLength(2);
    expect(segmentDistanceKm("jerusalem", "bethlehem")).toBeGreaterThan(
      haversineKm(PLACES.jerusalem, PLACES.bethlehem),
    );
  });

  it("ignores unknown places", () => {
    expect(segmentPath("nowhere", "jerusalem")).toEqual([]);
    expect(segmentDistanceKm("nowhere", "jerusalem")).toBe(0);
  });

  it("never measures shorter than the straight line", () => {
    for (const journey of Object.values(JOURNEY_BY_ID)) {
      for (const leg of journey.legs) {
        for (let i = 1; i < leg.stops.length; i++) {
          const a = PLACES[leg.stops[i - 1].place];
          const b = PLACES[leg.stops[i].place];
          if (!a || !b || a.id === b.id) continue;
          const measured = segmentDistanceKm(a.id, b.id, leg.bySea);
          expect(measured).toBeGreaterThanOrEqual(haversineKm(a, b) * 0.99);
        }
      }
    }
  });

  it("gives Paul's first journey a realistic travel distance", () => {
    const leg = JOURNEY_BY_ID.paul.legs[0];
    const km = totalDistanceKm(leg.stops, leg.bySea);
    expect(km).toBeGreaterThan(1900);
    expect(km).toBeLessThan(3600);
  });

  it("joins segments into one continuous route path", () => {
    const ids = ["antioch", "salamis", "paphos"];
    const path = routePath(ids);
    expect(path[0]).toEqual([PLACES.antioch.lon, PLACES.antioch.lat]);
    expect(path.at(-1)).toEqual([PLACES.paphos.lon, PLACES.paphos.lat]);
    expect(pathLengthKm(path)).toBeGreaterThan(0);
  });

  it("has a curated corridor for every journey segment", () => {
    const missing: string[] = [];
    for (const journey of Object.values(JOURNEY_BY_ID)) {
      for (const leg of journey.legs) {
        for (let i = 1; i < leg.stops.length; i++) {
          const a = leg.stops[i - 1].place;
          const b = leg.stops[i].place;
          if (a === b) continue;
          if (!corridorFor(a, b)) missing.push(`${journey.id}/${leg.id}: ${a}>${b}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("gives every shipped segment reusable geometry, mode and accuracy metadata", () => {
    for (const journey of Object.values(JOURNEY_BY_ID)) {
      for (const leg of journey.legs) {
        const segments = journeySegments(leg.stops, leg.bySea);
        expect(segments).toHaveLength(leg.stops.length - 1);
        for (const segment of segments) {
          expect(segment.routeGeometry.length).toBeGreaterThan(2);
          expect(["walking", "maritime"]).toContain(segment.routeType);
          expect(["verified", "approximate", "schematic"]).toContain(segment.historicalAccuracy);
          expect(segment.routeNote.length).toBeGreaterThan(20);
          expect(segment.bibleReferences.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("follows sampled waypoints when locating the traveller", () => {
    const path = routePath(["ur", "haran"]);
    const halfway = pointAlongPath(path, 0.5);
    expect(halfway).not.toBeNull();
    expect(halfway).not.toEqual([
      (PLACES.ur.lon + PLACES.haran.lon) / 2,
      (PLACES.ur.lat + PLACES.haran.lat) / 2,
    ]);
  });

  it("supports mixed walking and maritime segments in one route", () => {
    const segments = routeSegments(["antioch", "salamis", "paphos"]);
    expect(segments.map((segment) => segment.mode)).toEqual(["maritime", "walking"]);
  });

  it("keeps the Samaria comparison outside journey distance and playback stops", () => {
    const journey = JOURNEY_BY_ID["jesus-through-samaria"];
    const leg = journey.legs[0];
    expect(leg.stops.map((stop) => stop.place)).toEqual([
      "judea", "samaria", "sychar", "jacobs-well", "mount-gerizim", "sychar", "galilee",
    ]);
    expect(journey.comparisonRoutes?.[0].status).toBe("debated");
    expect(journey.comparisonRoutes?.[0].supportingPlaceIds).toContain("perea");
    expect(journeySegments(leg.stops)).toHaveLength(leg.stops.length - 1);
  });

  it("measures the Exodus, Jesus and Joshua routes along the roads", () => {
    const exodus = JOURNEY_BY_ID.exodus.legs[0];
    const jesus = JOURNEY_BY_ID.jesus.legs[0];
    const joshua = JOURNEY_BY_ID.joshua.legs[0];
    expect(totalDistanceKm(exodus.stops, exodus.bySea)).toBeGreaterThan(600);
    expect(totalDistanceKm(jesus.stops, jesus.bySea)).toBeGreaterThan(400);
    expect(totalDistanceKm(joshua.stops, joshua.bySea)).toBeGreaterThan(200);
  });
});
