import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BIBLE_LANDS,
  areaTiles,
  areaUrls,
  cacheUrl,
  formatSavedAt,
  regionTiles,
  tileXY,
  verifyArea,
  type SavedArea,
} from "./tile-cache";

const fakeCache = () => ({ put: vi.fn(async () => undefined) }) as unknown as Cache;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const STYLE = {
  sources: { composite: { url: "mapbox://mapbox.mapbox-streets-v8,mapbox.mapbox-terrain-v2" } },
  sprite: "mapbox://sprites/mapbox/outdoors-v12",
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  layers: [{ layout: { "text-font": ["DIN Pro Medium"] } }],
};

describe("tile coordinates", () => {
  it("keeps the atlas region within valid slippy bounds", () => {
    const [x, y] = tileXY(35.3, 31.8, 7);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
  });

  it("covers the close-up zoom used when a place is opened", () => {
    expect(regionTiles().some((tile) => tile.z === 8)).toBe(true);
  });

  it("scopes tiles to the requested area", () => {
    const small = areaTiles({ id: "x", label: "x", bounds: [35, 31, 36, 32], zooms: [8] });
    expect(small.length).toBeLessThan(areaTiles(BIBLE_LANDS).length);
  });
});

describe("areaUrls", () => {
  it("includes the pieces the live map needs, not just tiles", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(STYLE), { status: 200 })));
    const urls = await areaUrls({ id: "x", label: "x", bounds: [35, 31, 35.5, 31.5], zooms: [8] });
    expect(urls.some((url) => url.includes("/styles/v1/mapbox/outdoors-v12?"))).toBe(true);
    expect(urls.some((url) => url.includes(".json?secure"))).toBe(true);
    expect(urls.some((url) => url.includes("iconset.pbf"))).toBe(true);
    expect(urls.some((url) => url.includes("/sprite@2x.png"))).toBe(true);
    expect(urls.some((url) => url.includes("/fonts/v1/mapbox/DIN%20Pro%20Medium/0-255.pbf"))).toBe(true);
    expect(urls.some((url) => url.includes(".vector.pbf"))).toBe(true);
  });
});

describe("verifyArea", () => {
  const area = (urls: string[]): SavedArea => ({
    id: "x",
    label: "x",
    bounds: [35, 31, 35.5, 31.5],
    zooms: [8],
    urls,
    stored: urls.length,
    required: urls.length,
    bytes: 100,
    savedAt: Date.now(),
    verifiedAt: null,
    state: "finalizing",
  });

  it("passes only when every sampled piece reads back", async () => {
    const match = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("caches", { open: async () => ({ match }) });
    await expect(verifyArea(area(["a", "b", "c"]))).resolves.toEqual({ ok: true, missing: 0 });
  });

  it("reports missing pieces instead of claiming success", async () => {
    const match = vi.fn(async () => undefined);
    vi.stubGlobal("caches", { open: async () => ({ match }) });
    const result = await verifyArea(area(["a", "b", "c"]));
    expect(result.ok).toBe(false);
    expect(result.missing).toBeGreaterThan(0);
  });
});

describe("cacheUrl", () => {
  it("stores a tile and reports its size", async () => {
    const cache = fakeCache();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(new Uint8Array(12), { status: 200 })),
    );
    await expect(cacheUrl(cache, "https://example.test/tile")).resolves.toBe(12);
    expect(cache.put).toHaveBeenCalledTimes(1);
  });

  it("skips a tile that keeps failing instead of hanging", async () => {
    const cache = fakeCache();
    const fetchMock = vi.fn(async () => {
      throw new Error("network down");
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(cacheUrl(cache, "https://example.test/tile")).resolves.toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(cache.put).not.toHaveBeenCalled();
  });

  it("does not retry a permanent client error", async () => {
    const cache = fakeCache();
    const fetchMock = vi.fn(async () => new Response("no", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(cacheUrl(cache, "https://example.test/tile")).resolves.toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up immediately once the save is cancelled", async () => {
    const cache = fakeCache();
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(cacheUrl(cache, "https://example.test/tile", controller.signal)).resolves.toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces a full device instead of silently skipping", async () => {
    const quota = Object.assign(new Error("full"), { name: "QuotaExceededError" });
    const cache = { put: vi.fn(async () => { throw quota; }) } as unknown as Cache;
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array(4), { status: 200 })));
    await expect(cacheUrl(cache, "https://example.test/tile")).rejects.toThrow("Storage is full");
  });
});

describe("formatSavedAt", () => {
  it("says today for a save made today", () => {
    expect(formatSavedAt(Date.now())).toBe("Downloaded today");
  });
  it("is empty when nothing was saved", () => {
    expect(formatSavedAt(null)).toBe("");
  });
});
