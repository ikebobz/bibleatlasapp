import { getBook, type Chapter } from "./bible";
import { isChapterComplete } from "./chapter-complete";
import { versesInChapter } from "./verse-counts.generated";
import { boundedCache } from "./lru";
import { DEFAULT_TRANSLATION, getTranslation, type TranslationId } from "./translations";

type ApiVerse = { verse: number; text: string };

/**
 * Chapters are hot and identical for every reader, so they are cached — but
 * bounded: an unbounded Map grows with the canon on every worker isolate.
 */
const cache = boundedCache<Chapter>(250);

const TIMEOUT_MS = 3500;
/**
 * Total budget across all upstream attempts. SSR streams have a hard lifetime,
 * so we give up early rather than aborting the whole document render.
 */
const TOTAL_BUDGET_MS = 8000;

function strip(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Thrown when an upstream rate-limits us; retrying the same host is pointless. */
class UpstreamStatusError extends Error {
  constructor(readonly status: number) {
    super(`Upstream responded ${status}`);
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new UpstreamStatusError(res.status);
  return res.json();
}


/** Primary source: bible-api.com. */
export function bibleApiUrl(apiName: string, chapter: number, apiCode: string, oneChapterVerses = 0) {
  // bible-api reads "philemon 1" as verse 1 for one-chapter books, so those
  // must ask for the explicit verse range.
  const ref = oneChapterVerses ? `${chapter}:1-${oneChapterVerses}` : String(chapter);
  return `https://bible-api.com/${apiName}+${ref}?translation=${apiCode}`;
}

async function fromBibleApi(apiName: string, chapter: number, apiCode: string, oneChapterVerses = 0) {
  const json = (await fetchJson(bibleApiUrl(apiName, chapter, apiCode, oneChapterVerses))) as {
    verses?: ApiVerse[];
  };
  return (json.verses ?? []).map((v) => ({
    number: v.verse,
    text: String(v.text).replace(/\s+/g, " ").trim(),
  }));
}

/** Fallback source: bolls.life, the same index the search layer already uses. */
async function fromBolls(bookNum: number, chapter: number, searchCode: string) {
  const json = (await fetchJson(
    `https://bolls.life/get-chapter/${searchCode}/${bookNum}/${chapter}/`,
  )) as { verse?: number; text?: string }[];
  return (Array.isArray(json) ? json : [])
    .filter((v) => typeof v.verse === "number" && v.text)
    .map((v) => ({ number: v.verse as number, text: strip(String(v.text)) }));
}

/** Source for public-domain texts the other two lack (e.g. Reina-Valera 1909). */
async function fromGetBible(bookNum: number, chapter: number, getbibleCode: string) {
  const json = (await fetchJson(
    `https://api.getbible.net/v2/${getbibleCode}/${bookNum}/${chapter}.json`,
  )) as { verses?: ApiVerse[] };
  return (json.verses ?? [])
    .filter((v) => typeof v.verse === "number" && v.text)
    .map((v) => ({ number: v.verse, text: strip(String(v.text)) }));
}

/**
 * Fetch a chapter in a public-domain translation and normalise it.
 *
 * Scripture is the product, so a single upstream outage must not take the app
 * down: the primary API is tried twice (short timeout), then a second,
 * independent source is tried before we surface an error.
 */
export async function loadChapter(
  bookId: string,
  chapter: number,
  translation: TranslationId = DEFAULT_TRANSLATION,
): Promise<Chapter> {
  const book = getBook(bookId);
  if (!book) throw new Error(`Unknown book: ${bookId}`);
  if (chapter < 1 || chapter > book.chapters) {
    throw new Error(`${book.name} has ${book.chapters} chapters`);
  }
  const version = getTranslation(translation);

  const { recordOps, recordCacheHit } = await import("./monitor.server");
  const startedAt = Date.now();
  const key = `${version.id}:${book.id}:${chapter}`;
  const hit = cache.get(key);
  if (hit) {
    recordCacheHit("scripture.chapter", "memory", startedAt);
    return hit;
  }

  let verses: { number: number; text: string }[] = [];
  // Only the sources that actually carry this translation are tried.
  const apiCode = version.apiCode;
  const oneChapterVerses = book.chapters === 1 ? versesInChapter(book.id, 1) : 0;
  const bollsCode = version.searchCode;
  const attempts: {
    source: string;
    host: string;
    run: () => Promise<{ number: number; text: string }[]>;
  }[] = [];
  // Licensed texts (NIV, MSG) come from API.Bible and have no other source.
  // Their responses go through the shared gateway: a transient 24h cache and
  // cross-isolate de-duplication, so the same chapter costs one request a day
  // rather than one per reader. Nothing licensed is ever stored on a device.
  if (version.apiBibleId) {
    const bibleId = version.apiBibleId;
    const run = async () => {
      const { cachedCall } = await import("./api/gateway.server");
      return cachedCall({
        provider: "api-bible",
        feature: "chapter",
        resource: `${book.id}:${chapter}`,
        translation: version.id,
        ttlMs: 24 * 60 * 60 * 1000,
        cacheable: (verses) => verses.length > 0,
        run: async () => {
          const { fromApiBible } = await import("./apibible.server");
          return fromApiBible(book.id, chapter, bibleId);
        },
      });
    };
    attempts.push({ source: "api-bible", host: "api-bible", run });
    attempts.push({ source: "api-bible-retry", host: "api-bible", run });
  }
  if (apiCode) {
    attempts.push({
      source: "bible-api",
      host: "bible-api",
      run: () => fromBibleApi(book.apiName, chapter, apiCode, oneChapterVerses),
    });
    attempts.push({
      source: "bible-api-retry",
      host: "bible-api",
      run: () => fromBibleApi(book.apiName, chapter, apiCode, oneChapterVerses),
    });
  }

  const getbibleCode = version.getbibleCode;
  if (getbibleCode) {
    attempts.push({
      source: "getbible",
      host: "getbible",
      run: () => fromGetBible(book.num, chapter, getbibleCode),
    });
    attempts.push({
      source: "getbible-retry",
      host: "getbible",
      run: () => fromGetBible(book.num, chapter, getbibleCode),
    });
  }

  if (bollsCode) {
    attempts.push({
      source: "bolls",
      host: "bolls",
      run: () => fromBolls(book.num, chapter, bollsCode),
    });
    if (!apiCode && !getbibleCode) {
      attempts.push({
        source: "bolls-retry",
        host: "bolls",
        run: () => fromBolls(book.num, chapter, bollsCode),
      });
    }
  }


  let lastError: unknown;
  // Nothing here is cached in this isolate, so this is where a runaway client
  // would start costing real requests. A throttled visitor skips the network
  // entirely and is served from our own store below.
  let throttled = false;
  try {
    const { enforceReadQuota } = await import("./ratelimit.server");
    await enforceReadQuota("chapter");
  } catch {
    throttled = true;
  }
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  // A 429/5xx applies to the host, not the request — retrying it just burns
  // budget, so the host is dropped and the next source is tried immediately.
  const blockedHosts = new Set<string>();
  let failures = 0;
  // A throttled visitor tries our own store first; if it has nothing, one
  // upstream attempt is still better than a guaranteed error page.
  let runnable = attempts;
  if (throttled && !version.displayOnly) {
    const { readCachedChapter } = await import("./chapter-fallback.server");
    const stored = await readCachedChapter(version.id, book.id, chapter);
    if (stored?.length) verses = stored;
    runnable = stored?.length ? [] : attempts.slice(0, 1);
  } else if (throttled) {
    runnable = attempts.slice(0, 1);
  }
  for (const attempt of runnable) {
    if (Date.now() >= deadline) break;
    if (blockedHosts.has(attempt.host)) continue;
    if (failures > 0) {
      // Backoff with jitter: hammering a struggling provider is how a hiccup
      // turns into a request storm.
      const { backoffDelay, sleep } = await import("./api/gateway.server");
      await sleep(backoffDelay(failures - 1));
    }
    const attemptStart = Date.now();
    try {
      verses = await attempt.run();
      // A partial chapter is a failure: try the next source rather than show or save it.
      const partial = verses.length > 0 && !isChapterComplete(book.id, chapter, verses);
      if (partial) verses = [];
      // An empty body is an upstream failure too — record it as one so the
      // dashboard shows the real error rate per source.
      recordOps({
        surface: "scripture.chapter",
        kind: "api",
        outcome: verses.length ? "ok" : "error",
        cache: "miss",
        source: attempt.source,
        durationMs: Date.now() - attemptStart,
        detail: verses.length ? null : partial ? "partial response" : "empty response",
      });
      if (verses.length) break;
      failures += 1;
    } catch (error) {
      lastError = error;
      failures += 1;
      // 429/5xx is a host-level condition, and a 4xx other than 429 will fail
      // identically on retry — in both cases stop asking this host.
      if (error instanceof UpstreamStatusError) blockedHosts.add(attempt.host);
      recordOps({
        surface: "scripture.chapter",
        kind: "api",
        outcome: "error",
        cache: "miss",
        source: attempt.source,
        durationMs: Date.now() - attemptStart,
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const licensed = Boolean(version.displayOnly);

  if (verses.length === 0 && !licensed) {
    // Every provider is down or rate-limiting us: serve the last-known-good
    // text from our own store rather than a broken page.
    const fallbackStart = Date.now();
    const { readCachedChapter } = await import("./chapter-fallback.server");
    const stored = await readCachedChapter(version.id, book.id, chapter);
    if (stored?.length) {
      verses = stored;
      recordOps({
        surface: "scripture.chapter",
        kind: "api",
        outcome: "ok",
        cache: "hit",
        source: "db-fallback",
        durationMs: Date.now() - fallbackStart,
        detail: "upstream unavailable",
      });
    }
  }

  if (verses.length === 0) {
    if (!lastError) {
      lastError = new Error(
        throttled ? "throttled, no saved copy" : runnable.length ? "every source returned empty or partial text" : "no source for this translation",
      );
    }
    console.error("Chapter load failed", { book: book.id, chapter, translation: version.id, throttled, attempts: attempts.length, error: String(lastError) });
    throw new Error(`Could not load ${book.name} ${chapter} right now. Please try again.`);
  }



  const result: Chapter = {
    book: book.id,
    bookName: book.name,
    chapter,
    reference: `${book.name} ${chapter}`,
    verses,
  };
  cache.set(key, result);
  // Mirror public-domain text for the next provider outage (best-effort, and
  // never for licensed texts, which are display-only).
  if (!licensed) {
    void import("./chapter-fallback.server").then(({ writeCachedChapter }) =>
      writeCachedChapter(version.id, book.id, chapter, verses),
    );
  }
  return result;
}

