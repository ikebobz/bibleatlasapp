import { BOOKS, bookName } from "./bible";
import { DEFAULT_TRANSLATION, getTranslation, searchSourceFor, type TranslationId } from "./translations";

/** Canonical book numbers used by the bolls.life indexes (1 Genesis – 66 Revelation). */
const BY_NUMBER = new Map(BOOKS.map((b) => [b.num, b.id]));

export type SearchHit = {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
};

export type SearchResponse = {
  /** The translation the results actually came from. */
  translation: string;
  /** False when this translation has no text-search source at all. */
  supported: boolean;
  hits: SearchHit[];
};

type ApiHit = { book: number; chapter: number; verse: number; text: string };

export function cleanSearchText(html: string) {
  return html
    // Strong's numbers ride along with some bolls indexes (KJV); drop them so
    // the verse reads normally.
    .replace(/<S>\s*\d+\s*<\/S>/gi, "")
    .replace(/<[^>]+>/g, "")

    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const clean = cleanSearchText;

/**
 * Cache lifetimes. Scripture never changes, so a search result is valid for a
 * long time; licensed catalogues get a shorter window.
 */
const PUBLIC_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const LICENSED_TTL_MS = 1000 * 60 * 60 * 24;

/**
 * Normalise a query so trivially different spellings share one cache entry:
 * `Faith `, `faith` and `FAITH!` are the same search.
 */
export function normaliseQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'’-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchBolls(code: string, q: string, limit: number): Promise<SearchHit[]> {
  // Ask only for what the UI can show; over-fetching costs bandwidth on every
  // cache miss and buys nothing.
  const upstreamLimit = Math.min(100, Math.max(limit * 2, limit));
  const url = `https://bolls.life/v2/find/${encodeURIComponent(code)}?search=${encodeURIComponent(q)}&limit=${upstreamLimit}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (res.status === 400 || res.status === 404) return [];
  if (!res.ok) throw new Error(`Search failed (${res.status})`);

  const json = (await res.json()) as { results?: ApiHit[] } | ApiHit[];
  const rows: ApiHit[] = Array.isArray(json) ? json : (json.results ?? []);

  const out: SearchHit[] = [];
  for (const r of rows) {
    const id = BY_NUMBER.get(r.book);
    if (!id) continue;
    const meta = BOOKS.find((b) => b.id === id);
    if (!meta || r.chapter > meta.chapters) continue;
    out.push({
      book: id,
      bookName: meta.name,
      chapter: r.chapter,
      verse: r.verse,
      reference: `${meta.name} ${r.chapter}:${r.verse}`,
      text: clean(r.text),
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Full-text search of the selected translation, limited to the books we ship. */
export async function searchBible(
  query: string,
  translation: TranslationId = DEFAULT_TRANSLATION,
  limit = 25,
): Promise<SearchResponse> {
  const q = query.trim();
  const source = searchSourceFor(translation);
  if (source.kind === "none") return { translation, supported: false, hits: [] };
  // The upstream indexes reject very short terms, so treat them as "no results".
  if (q.length < 3) return { translation, supported: true, hits: [] };

  const normalised = normaliseQuery(q);
  if (normalised.length < 3) return { translation, supported: true, hits: [] };

  const { cachedCall } = await import("./api/gateway.server");
  const hits = await cachedCall<SearchHit[]>({
    provider: source.kind === "bolls" ? "bolls" : "api-bible",
    feature: "search",
    resource: `${limit}:${normalised}`,
    translation,
    ttlMs: source.kind === "bolls" ? PUBLIC_TTL_MS : LICENSED_TTL_MS,
    onUpstream: async () => {
      const { enforceReadQuota } = await import("./ratelimit.server");
      await enforceReadQuota("search");
    },
    run: async () => {
      if (source.kind === "bolls") return searchBolls(source.code, normalised, limit);
      const { searchApiBible } = await import("./apibible.server");
      return searchApiBible(normalised, source.bibleId, limit);
    },
  });

  return { translation, supported: true, hits };
}

/** Fire-and-forget search analytics; never allowed to break a search. */
export async function logSearchEvent(payload: {
  query: string;
  translation: string;
  results: number;
  outcome: "ok" | "unsupported" | "error";
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("share_events").insert({
      event: "bible_search",
      channel: payload.outcome,
      resource_type: "chapter",
      resource_ref: `${payload.query.slice(0, 100)} · ${payload.results}`,
      translation: getTranslation(payload.translation).label.slice(0, 16),
    });
  } catch {
    /* analytics never breaks search */
  }
}
