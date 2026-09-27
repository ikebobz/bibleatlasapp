/**
 * One-time ingest of the KJV text into `bible_verses`.
 *
 * The concordance needs exact occurrence counts and instant results, which the
 * live chapter APIs cannot give (their search endpoints cap results). So the
 * public-domain KJV is loaded once into Postgres and searched with a GIN index.
 */

import { BOOKS } from "@/lib/bible";

const SOURCE = "https://bolls.life/static/translations/KJV.json";

type RawVerse = { book: number; chapter: number; verse: number; text: string };

/** Strip Strong's markers and any stray markup from the source text. */
export function cleanVerse(text: string): string {
  return text
    .replace(/<S>\d+<\/S>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** The whole KJV is ~12 MB, so it is downloaded once per worker isolate. */
let cached: Promise<RawVerse[]> | null = null;

async function loadSource(): Promise<RawVerse[]> {
  if (!cached) {
    cached = (async () => {
      const res = await fetch(SOURCE, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`KJV source responded ${res.status}`);
      const json = (await res.json()) as RawVerse[];
      if (!Array.isArray(json) || json.length < 30000) throw new Error("KJV source looks truncated");
      return json;
    })();
    cached.catch(() => {
      cached = null;
    });
  }
  return cached;
}

const BY_NUM = new Map(BOOKS.map((b) => [b.num, b]));

export type IngestResult = { book: string; inserted: number };

/** Ingest a single book (1–66). Idempotent: rows are upserted on their key. */
export async function ingestBook(bookNum: number): Promise<IngestResult> {
  const meta = BY_NUM.get(bookNum);
  if (!meta) throw new Error(`Unknown book number: ${bookNum}`);

  const all = await loadSource();
  const rows = all
    .filter((v) => v.book === bookNum && v.chapter <= meta.chapters)
    .map((v) => ({
      book: meta.id,
      chapter: v.chapter,
      verse: v.verse,
      text: cleanVerse(String(v.text)),
      testament: meta.testament,
      book_num: meta.num,
    }))
    .filter((v) => v.text.length > 0);

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabaseAdmin
      .from("bible_verses")
      .upsert(rows.slice(i, i + CHUNK), { onConflict: "book,chapter,verse" });
    if (error) throw new Error(`Upsert failed for ${meta.id}: ${error.message}`);
  }

  return { book: meta.id, inserted: rows.length };
}

/** Progress report: how many verses are stored per book so far. */
export async function ingestStatus() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("bible_verses")
    .select("*", { count: "exact", head: true });
  return { verses: count ?? 0, books: BOOKS.length };
}
