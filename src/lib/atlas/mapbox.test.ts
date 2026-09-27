import { describe, expect, it } from "vitest";
import {
  MAPBOX_TOKEN,
  MAP_STYLES,
  MAP_STYLE_IDS,
  hasMapbox,
  placesBounds,
  combinedRouteBounds,
  placesGeoJSON,
  responsiveCameraPadding,
  routeBounds,
  routeGeoJSON,
  segmentBounds,
  stopsBounds,
} from "./mapbox";

describe("mapbox config", () => {
  it("only enables the live map for a pk.* public token", () => {
    expect(hasMapbox).toBe(MAPBOX_TOKEN.startsWith("pk."));
  });

  it("offers topographic, satellite, and terrain styles", () => {
    expect(MAP_STYLE_IDS).toEqual(["outdoors", "satellite", "terrain"]);
    for (const id of MAP_STYLE_IDS) {
      expect(MAP_STYLES[id].url).toContain("mapbox://styles/mapbox/");
      expect(MAP_STYLES[id].label.length).toBeGreaterThan(0);
    }
  });
});

describe("routeGeoJSON", () => {
  it("builds a line and numbered stop points from known places", () => {
    const data = routeGeoJSON([
      { place: "ur", label: "Ur" },
      { place: "haran" },
      { place: "jerusalem" },
    ]);
    const route = data.features.find((feature) => feature.properties.role === "route");
    const stops = data.features.filter((feature) => feature.properties.role === "stop");
    expect(route?.geometry.type).toBe("LineString");
    expect(stops).toHaveLength(3);
    expect(stops[0].geometry.type).toBe("Point");
    expect(stops[0].properties.index).toBe(0);
    expect(stops[0].properties.label).toBe("Ur");
    expect(stops[1].properties.label).toBe("Haran");
    expect(data.features.filter((feature) => feature.properties.role === "route")).toHaveLength(2);
    expect(route?.properties.accuracy).toBe("approximate");
    expect(route?.properties.mode).toBe("walking");
  });

  it("adds travelled geometry without removing the quiet full route", () => {
    const data = routeGeoJSON([{ place: "antioch" }, { place: "salamis" }, { place: "paphos" }], 1.5);
    const routes = data.features.filter((feature) => feature.properties.role === "route");
    expect(routes.some((feature) => feature.properties.state === "future")).toBe(true);
    expect(routes.some((feature) => feature.properties.state === "travelled")).toBe(true);
    expect(routes.some((feature) => feature.properties.mode === "maritime")).toBe(true);
  });

  it("adds comparison geometry without changing primary route progress", () => {
    const comparison = {
      id: "east",
      name: "Eastern alternative",
      shortLabel: "Alternative",
      note: "Schematic comparison only.",
      status: "debated" as const,
      supportingPlaceIds: ["perea"],
      geometry: [[35.2, 31.75], [35.7, 31.9], [35.42, 32.75]] as [number, number][],
    };
    const data = routeGeoJSON([{ place: "judea" }, { place: "galilee" }], 1, [comparison]);
    expect(data.features.filter((feature) => feature.properties.role === "comparison-route")).toHaveLength(1);
    expect(data.features.filter((feature) => feature.properties.role === "comparison-place")).toHaveLength(1);
    expect(data.features.filter((feature) => feature.properties.role === "route" && feature.properties.state === "travelled")).toHaveLength(1);
  });

  it("omits the route line for a single stop and skips unknown places", () => {
    const data = routeGeoJSON([{ place: "jerusalem" }, { place: "nowhere" }]);
    expect(data.features.some((feature) => feature.properties.role === "route")).toBe(false);
    expect(data.features.filter((feature) => feature.properties.role === "stop")).toHaveLength(1);
  });
});

describe("placesGeoJSON", () => {
  it("marks the selected place and skips unknown ids", () => {
    const data = placesGeoJSON(["nazareth", "nowhere", "jerusalem"], "jerusalem");
    const points = data.features.filter((f) => f.properties.role === "place");
    expect(points).toHaveLength(2);
    expect(data.features.some((f) => f.properties.role === "place-area" && f.properties.place === "jerusalem")).toBe(true);
    const selected = points.find((feature) => feature.properties.selected === 1);
    expect(selected?.properties.place).toBe("jerusalem");
  });
});

describe("bounds helpers", () => {
  it("computes a west/south/east/north box around stops", () => {
    const bounds = stopsBounds([{ place: "ur" }, { place: "jerusalem" }]);
    expect(bounds).not.toBeNull();
    const [[west, south], [east, north]] = bounds!;
    expect(west).toBeLessThan(east);
    expect(south).toBeLessThan(north);
    expect(west).toBeCloseTo(35.23, 2);
    expect(east).toBeCloseTo(46.1, 2);
  });

  it("returns null for empty content", () => {
    expect(stopsBounds([])).toBeNull();
    expect(placesBounds([])).toBeNull();
    expect(placesBounds(["nowhere"])).toBeNull();
  });

  it("uses sampled route geometry for whole-route and segment bounds", () => {
    const stops = [{ place: "antioch" }, { place: "salamis" }, { place: "paphos" }];
    expect(routeBounds(stops)).not.toBeNull();
    expect(segmentBounds(stops, 1)).not.toBeNull();
    expect(segmentBounds(stops, 2)).not.toEqual(segmentBounds(stops, 1));
  });

  it("includes comparison geometry in combined journey bounds", () => {
    const primary = routeBounds([{ place: "judea" }, { place: "galilee" }]);
    const combined = combinedRouteBounds([{ place: "judea" }, { place: "galilee" }], [{
      id: "east", name: "Eastern alternative", shortLabel: "Alternative", note: "Schematic", status: "debated",
      supportingPlaceIds: ["perea"], geometry: [[35.2, 31.75], [35.7, 31.9], [35.42, 32.75]],
    }]);
    expect(combined?.[1][0]).toBeGreaterThan(primary?.[1][0] ?? 0);
  });

  it("reserves more bottom space on portrait phones", () => {
    expect(responsiveCameraPadding(320, 640).bottom).toBeGreaterThan(150);
    expect(responsiveCameraPadding(1280, 900).left).toBe(48);
    expect(responsiveCameraPadding(390, 844, { bottom: 300 }).bottom).toBe(300);
  });
});
