/**
 * Offline map storage for /maps.
 *
 * Bytes live in the service-worker cache (`atlas-map-tiles`) because the map
 * library fetches them from background workers; an IndexedDB index records
 * every stored piece plus one record per saved area, so the UI can show a
 * verified state that survives a refresh, navigation and an app restart.
 *
 * A saved area is only reported as "saved" after a verification pass proves
 * the required pieces can be read back out of storage.
 */

import { MAPBOX_TOKEN, styleJsonUrl } from "./mapbox";

export const TILE_CACHE_NAME = "atlas-map-tiles";
const DB_NAME = "bible-atlas-map-tiles";
const DB_VERSION = 2;
const STORE = "tiles";
const META = "meta";
const AREAS_KEY = "areas";

/** Default atlas region (the biblical world) and the zooms worth keeping. */
export const BIBLE_LANDS: AreaSpec = {
  id: "bible-lands",
  label: "Bible lands",
  bounds: [10, 25.5, 50, 42.5],
  zooms: [4, 5, 6, 7, 8],
};

/** Per-request limits: a stalled piece must never freeze the whole save. */
const REQUEST_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 3;
const CONCURRENCY = 6;
/** Glyph ranges the biblical-region labels actually use. */
const GLYPH_RANGES = ["0-255", "256-511", "1536-1791", "8192-8447"];
const VERIFY_SAMPLE = 24;

export type AreaSpec = {
  id: string;
  label: string;
  /** [west, south, east, north] */
  bounds: [number, number, number, number];
  zooms: number[];
};

export type AreaState = "downloading" | "finalizing" | "verifying" | "saved" | "failed";

export type SavedArea = AreaSpec & {
  urls: string[];
  stored: number;
  required: number;
  bytes: number;
  savedAt: number | null;
  verifiedAt: number | null;
  state: AreaState;
  reason?: string;
};

export type SavePhase = "preparing" | "downloading" | "finalizing" | "verifying";
export type SaveProgress = { phase: SavePhase; stored: number; required: number };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(db: IDBDatabase, store: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    const request = run(db.transaction(store, mode).objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Longitude/latitude to slippy tile coordinates. */
export function tileXY(lon: number, lat: number, zoom: number): [number, number] {
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const radians = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) * n);
  return [Math.min(Math.max(x, 0), n - 1), Math.min(Math.max(y, 0), n - 1)];
}

/** Every tile coordinate covering an area across its zooms. */
export function areaTiles(area: AreaSpec): Array<{ z: number; x: number; y: number }> {
  const [west, south, east, north] = area.bounds;
  const list: Array<{ z: number; x: number; y: number }> = [];
  for (const z of area.zooms) {
    const [x0, y0] = tileXY(west, north, z);
    const [x1, y1] = tileXY(east, south, z);
    for (let x = x0; x <= x1; x += 1) for (let y = y0; y <= y1; y += 1) list.push({ z, x, y });
  }
  return list;
}

/** Back-compat helper used by older callers/tests. */
export function regionTiles() {
  return areaTiles(BIBLE_LANDS);
}

type StyleDoc = {
  sources: Record<string, { url?: string; type?: string }>;
  sprite?: string;
  glyphs?: string;
  layers?: Array<{ layout?: Record<string, unknown> }>;
};

let styleDocCache: StyleDoc | null = null;

async function styleDoc(): Promise<StyleDoc> {
  if (styleDocCache) return styleDocCache;
  const response = await fetch(styleJsonUrl("outdoors"), { cache: "force-cache" });
  if (!response.ok) throw new Error(`style ${response.status}`);
  styleDocCache = (await response.json()) as StyleDoc;
  return styleDocCache;
}

function fontStacks(style: StyleDoc): string[] {
  const fonts = new Set<string>(["DIN Pro Medium", "DIN Pro Regular", "DIN Pro Bold", "Arial Unicode MS Regular", "Arial Unicode MS Bold"]);
  for (const layer of style.layers ?? []) {
    const value = layer.layout?.["text-font"];
    if (Array.isArray(value)) for (const font of value) if (typeof font === "string") fonts.add(font);
  }
  return [...fonts];
}

/**
 * Every address the live map asks for when it draws this area: the style, its
 * tile directory, icons, sprites, label fonts and the vector tiles themselves.
 * The shapes here were taken from the requests the map actually issues.
 */
export async function areaUrls(area: AreaSpec): Promise<string[]> {
  const style = await styleDoc();
  const token = `access_token=${MAPBOX_TOKEN}`;
  const base = styleJsonUrl("outdoors").split("?")[0];
  const composite = Object.values(style.sources).find((source) => source.url?.startsWith("mapbox://"));
  const ids = composite?.url?.replace("mapbox://", "") ?? "mapbox.mapbox-streets-v8";
  // mapbox://sprites/mapbox/outdoors-v12 is served as .../styles/v1/mapbox/outdoors-v12/sprite
  const spriteBase = style.sprite?.startsWith("mapbox://sprites/")
    ? `${style.sprite.replace("mapbox://sprites/", "https://api.mapbox.com/styles/v1/")}/sprite`
    : (style.sprite ?? `${base}/sprite`);
  const glyphsTemplate = (style.glyphs ?? "mapbox://fonts/mapbox/{fontstack}/{range}.pbf").replace(
    "mapbox://fonts/",
    "https://api.mapbox.com/fonts/v1/",
  );

  const urls = [
    `${base}?${token}`,
    `https://api.mapbox.com/v4/${ids}.json?secure&${token}`,
    `${base}/iconset.pbf?${token}`,
    `${spriteBase}.json?${token}`,
    `${spriteBase}.png?${token}`,
    `${spriteBase}@2x.json?${token}`,
    `${spriteBase}@2x.png?${token}`,
  ];

  for (const font of fontStacks(style)) {
    for (const range of GLYPH_RANGES) {
      urls.push(`${glyphsTemplate.replace("{fontstack}", encodeURIComponent(font)).replace("{range}", range)}?${token}`);
    }
  }

  for (const { z, x, y } of areaTiles(area)) {
    urls.push(`https://api.mapbox.com/v4/${ids}/${z}/${x}/${y}.vector.pbf?${token}`);
  }
  return urls;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class QuotaError extends Error {}

/**
 * Fetch one piece and store it. Every attempt is time-limited and retried; a
 * piece that still cannot be stored returns 0 so it is never counted as saved.
 */
export async function cacheUrl(cache: Cache, url: string, signal?: AbortSignal): Promise<number> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (signal?.aborted) return 0;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(url, { mode: "cors", signal: controller.signal });
      if (!response.ok) {
        // 4xx other than rate limiting will not get better on a retry.
        if (response.status !== 429 && response.status < 500) return 0;
        throw new Error(`tile ${response.status}`);
      }
      const body = await response.clone().arrayBuffer();
      await cache.put(url, response);
      return body.byteLength;
    } catch (error) {
      if ((error as Error)?.name === "QuotaExceededError") throw new QuotaError("Storage is full");
      if (signal?.aborted || attempt === MAX_ATTEMPTS) return 0;
      await wait(400 * attempt);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }
  return 0;
}

async function readAreas(db: IDBDatabase): Promise<Record<string, SavedArea>> {
  return (await tx<Record<string, SavedArea> | undefined>(db, META, "readonly", (store) => store.get(AREAS_KEY))) ?? {};
}

async function writeArea(db: IDBDatabase, area: SavedArea) {
  const areas = await readAreas(db);
  areas[area.id] = area;
  await tx(db, META, "readwrite", (store) => store.put(areas, AREAS_KEY));
}

/** Every area the device has a record for. */
export async function savedAreas(): Promise<SavedArea[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const db = await openDb();
    const areas = await readAreas(db);
    db.close();
    return Object.values(areas);
  } catch {
    return [];
  }
}

/** True when the map library can actually be served from what was saved. */
export function offlineMapsSupported(): boolean {
  return (
    typeof caches !== "undefined" &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    Boolean(navigator.serviceWorker.controller)
  );
}

/**
 * Read a sample of the area's required pieces back out of storage. This is the
 * only thing that may promote an area to "saved".
 */
export async function verifyArea(area: SavedArea): Promise<{ ok: boolean; missing: number }> {
  if (typeof caches === "undefined") return { ok: false, missing: area.required };
  const cache = await caches.open(TILE_CACHE_NAME);
  const step = Math.max(1, Math.floor(area.urls.length / VERIFY_SAMPLE));
  const sample: string[] = [];
  for (let index = 0; index < area.urls.length && sample.length < VERIFY_SAMPLE; index += step) {
    sample.push(area.urls[index]);
  }
  // The first entries are the style, tile directory, icons, sprites and fonts:
  // without them a saved area cannot draw at all, so always check them.
  for (const url of area.urls.slice(0, 7)) if (!sample.includes(url)) sample.push(url);
  let missing = 0;
  for (const url of sample) {
    const hit = await cache.match(url, { ignoreSearch: true });
    if (!hit) missing += 1;
  }
  return { ok: missing === 0, missing };
}

/**
 * Download one area for offline use, then verify it. Progress counts pieces
 * genuinely stored, never pieces merely attempted, so a failing piece lowers
 * the percentage instead of inflating it.
 */
export async function saveArea(
  spec: AreaSpec,
  onProgress?: (progress: SaveProgress) => void,
  signal?: AbortSignal,
): Promise<SavedArea> {
  if (typeof caches === "undefined") throw new Error("Offline storage is unavailable in this browser");
  onProgress?.({ phase: "preparing", stored: 0, required: 0 });
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* best effort: persistence is a hint, not a requirement */
  }
  const cache = await caches.open(TILE_CACHE_NAME);
  const db = await openDb();
  const urls = await areaUrls(spec);
  const required = urls.length;
  let stored = 0;
  let bytes = 0;
  let quota = false;
  onProgress?.({ phase: "downloading", stored, required });

  const run = async (url: string) => {
    try {
      // Already on the device (e.g. a retry filling gaps): count it without
      // spending another map request.
      const existing = await cache.match(url, { ignoreSearch: true });
      if (existing) {
        stored += 1;
        return;
      }
      const size = await cacheUrl(cache, url, signal);
      if (size > 0) {
        bytes += size;
        await tx(db, STORE, "readwrite", (store) => store.put(size, url));
        stored += 1;
      }
    } catch (error) {
      if (error instanceof QuotaError) quota = true;
    } finally {
      onProgress?.({ phase: stored >= required - CONCURRENCY ? "finalizing" : "downloading", stored, required });
    }
  };

  let cursor = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, urls.length) }, async () => {
    while (cursor < urls.length && !quota) {
      if (signal?.aborted) return;
      const url = urls[cursor];
      cursor += 1;
      await run(url);
    }
  });
  await Promise.all(workers);

  const base: SavedArea = {
    ...spec,
    urls,
    stored,
    required,
    bytes,
    savedAt: Date.now(),
    verifiedAt: null,
    state: "failed",
  };

  if (signal?.aborted) {
    db.close();
    return { ...base, state: "failed", reason: "Save stopped" };
  }
  if (quota) {
    await writeArea(db, { ...base, reason: "Device storage is full" });
    db.close();
    return { ...base, reason: "Device storage is full" };
  }

  onProgress?.({ phase: "verifying", stored, required });
  const check = await verifyArea(base);
  const complete = stored >= required;
  const record: SavedArea = check.ok && complete
    ? { ...base, state: "saved", verifiedAt: Date.now() }
    : {
        ...base,
        state: "failed",
        reason: complete
          ? `${check.missing} pieces could not be read back`
          : `${required - stored} of ${required} pieces could not be downloaded`,
      };
  await writeArea(db, record);
  db.close();
  return record;
}

/** Re-check a stored record against what is actually in storage right now. */
export async function refreshArea(area: SavedArea): Promise<SavedArea> {
  const check = await verifyArea(area);
  if (check.ok) return area.state === "saved" ? area : { ...area, state: "saved", verifiedAt: Date.now() };
  return { ...area, state: "failed", reason: "Saved map is no longer on this device" };
}

/** Remove one saved area's data and its record. */
export async function removeArea(id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const areas = await readAreas(db);
  const area = areas[id];
  if (area) {
    const cache = typeof caches !== "undefined" ? await caches.open(TILE_CACHE_NAME) : null;
    const others = new Set(
      Object.values(areas)
        .filter((item) => item.id !== id)
        .flatMap((item) => item.urls),
    );
    for (const url of area.urls) {
      if (others.has(url)) continue;
      await cache?.delete(url, { ignoreSearch: true });
      await tx(db, STORE, "readwrite", (store) => store.delete(url));
    }
    delete areas[id];
    await tx(db, META, "readwrite", (store) => store.put(areas, AREAS_KEY));
  }
  db.close();
}

/** Remove every stored map piece and record. */
export async function clearAtlasTiles(): Promise<void> {
  if (typeof caches !== "undefined") await caches.delete(TILE_CACHE_NAME);
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await tx(db, STORE, "readwrite", (store) => store.clear());
    await tx(db, META, "readwrite", (store) => store.clear());
    db.close();
  } catch {
    /* nothing stored */
  }
}

/** True when at least one verified area is on this device. */
export async function hasOfflineTiles(): Promise<boolean> {
  return (await savedAreas()).some((area) => area.state === "saved");
}

/** Human-readable size for the offline map card. */
export function formatTileBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(Math.round(bytes / 1024), 1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Short "Downloaded today / 3 Jan" label for the saved-maps list. */
export function formatSavedAt(savedAt: number | null): string {
  if (!savedAt) return "";
  const date = new Date(savedAt);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay ? "Downloaded today" : `Downloaded ${date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`;
}
