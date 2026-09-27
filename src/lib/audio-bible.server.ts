import { usfmFor } from "./apibible.server";

/** Dramatized WEB New Testament — the historical default. */
const DEFAULT_AUDIO_BIBLE_ID = "105a06b6146d11e7-01";
const BASE = "https://api.scripture.api.bible/v1";
const ID_RE = /^[0-9a-f]{16}-\d{2}$/;

/** In-memory cache so repeated chapter loads don't burn the rate limit. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: unknown }>();
/** De-dupes concurrent requests for the same chapter into one upstream call. */
const inflight = new Map<string, Promise<AudioChapterResult>>();

/** Disabled under test so each case exercises a real upstream call. */
const cacheEnabled = process.env["NODE_ENV"] !== "test";

export function clearAudioChapterCache() {
  cache.clear();
  inflight.clear();
}

export type AudioChapterResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; status: number; detail?: string };

export function parseChapterNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
  }
  return null;
}

export function parseAudioBibleId(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return DEFAULT_AUDIO_BIBLE_ID;
  if (typeof value !== "string") return null;
  const id = value.trim().toLowerCase();
  return ID_RE.test(id) ? id : null;
}

export async function getAudioChapter({
  bookSlug,
  chapterNumber,
  audioBibleId,
  fresh = false,
}: {
  bookSlug: string;
  chapterNumber: unknown;
  audioBibleId?: unknown;
  fresh?: boolean;
}): Promise<AudioChapterResult> {
  const slug = bookSlug.trim().toLowerCase();
  if (!slug) {
    return { ok: false, error: "Missing or invalid bookSlug.", status: 400 };
  }

  const chapter = parseChapterNumber(chapterNumber);
  if (chapter === null) {
    return { ok: false, error: "Missing or invalid chapterNumber.", status: 400 };
  }

  const bibleId = parseAudioBibleId(audioBibleId);
  if (!bibleId) {
    return { ok: false, error: "Missing or invalid audioBibleId.", status: 400 };
  }

  const usfm = usfmFor(slug);
  if (!usfm) {
    return { ok: false, error: `Unknown book slug: ${bookSlug}`, status: 404 };
  }

  const chapterId = `${usfm}.${chapter}`;
  const key = `${bibleId}/${chapterId}`;
  if (!cacheEnabled) return fetchChapter(key, bibleId, chapterId);

  // Audio URLs are stable for a day; the shared gateway makes that one request
  // per chapter per day across every listener and every isolate.
  const { cachedCall } = await import("./api/gateway.server");
  return cachedCall<AudioChapterResult>({
    provider: "api-bible",
    feature: "audio",
    resource: chapterId,
    translation: bibleId,
    ttlMs: CACHE_TTL_MS,
    // Never cache a failure — the next listener should get a real attempt.
    cacheable: (result) => result.ok === true && audioLinkLifeMs(result) > 0,
    // Signed audio links expire (~12h) — never keep one past its own expiry.
    ttlFor: audioLinkLifeMs,
    isFresh: (result) => audioLinkLifeMs(result) > 0,
    bypass: fresh,
    run: () => fetchChapter(key, bibleId, chapterId),
  });
}

async function fetchChapter(
  key: string,
  bibleId: string,
  chapterId: string,
): Promise<AudioChapterResult> {
  const apiKey = process.env["API_BIBLE_KEY"];
  if (!apiKey) {
    return { ok: false, error: "API key is not configured.", status: 500 };
  }

  const url = `${BASE}/audio-bibles/${bibleId}/chapters/${chapterId}`;

  try {
    const upstream = await fetch(url, {
      headers: {
        "api-key": apiKey,
        "accept": "application/json",
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return {
        ok: false,
        error: `Upstream API error: ${upstream.status}`,
        status: upstream.status,
        detail: text,
      };
    }

    const data = (await upstream.json()) as unknown;
    // Caching is owned by the shared API gateway (memory + durable + dedupe).
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unexpected error",
      status: 500,
    };
  }
}

/** Keep a signed link only until this long before it expires. */
export const AUDIO_EXPIRY_MARGIN_MS = 10 * 60 * 1000;

/**
 * How much longer a resolved audio link may be served, in ms (<= 0 means
 * stale). Payloads without an expiry are trusted for the default day.
 */
export function audioLinkLifeMs(result: AudioChapterResult, now = Date.now()): number {
  if (!result.ok) return 0;
  const raw = (result.data as { data?: { expiresAt?: unknown } } | null)?.data?.expiresAt;
  const secs = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(secs) || secs <= 0) return CACHE_TTL_MS;
  return secs * 1000 - now - AUDIO_EXPIRY_MARGIN_MS;
}
