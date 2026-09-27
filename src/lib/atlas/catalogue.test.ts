import { describe, expect, it } from "vitest";
import { JOURNEYS } from "./journeys";
import { MAP_FEATURES, MAP_FEATURE_BY_ID, searchMapCatalogue } from "./catalogue";

describe("map catalogue integrity", () => {
  it("resolves every journey stop to a mapped feature", () => {
    for (const journey of JOURNEYS) {
      for (const leg of journey.legs) {
        for (const stop of leg.stops) expect(MAP_FEATURE_BY_ID[stop.place], `${journey.id}:${stop.place}`).toBeTruthy();
      }
    }
  });

  it("keeps coordinates and uncertain locations qualified", () => {
    for (const feature of MAP_FEATURES) {
      expect(feature.lon).toBeGreaterThanOrEqual(-180);
      expect(feature.lon).toBeLessThanOrEqual(180);
      expect(feature.lat).toBeGreaterThanOrEqual(-90);
      expect(feature.lat).toBeLessThanOrEqual(90);
      if (feature.certainty !== "probable" && feature.certainty !== "known") {
        expect(feature.certaintyNote?.length).toBeGreaterThan(10);
      }
    }
  });

  it("finds ancient, modern, and journey names locally", () => {
    expect(searchMapCatalogue("Kfar Nahum").features.some((f) => f.id === "capernaum")).toBe(true);
    expect(searchMapCatalogue("Capernaum").features.some((f) => f.id === "capernaum")).toBe(true);
    expect(searchMapCatalogue("missionary").journeys.some((j) => j.id === "paul")).toBe(true);
  });
});