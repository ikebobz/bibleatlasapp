/**
 * Concordance search. All work happens in Postgres against the indexed KJV
 * text (`bible_verses.tsv`, GIN), so no full scans happen in the app.
 */

import { BOOKS, bookName } from "@/lib/bible";

export type ConcordanceHit = {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  reference: string;
  text: string;
  testament: string;
};

export type ConcordanceStats = {
  term: string;
  word: string;
  total: number;
  ot: number;
  nt: number;
  verses: number;
} | null;

export type BookFacet = {
  book: string;
  bookName: string;
  bookNum: number;
  testament: string;
  hits: number;
};

export type ConcordanceResult = {
  query: string;
  hits: ConcordanceHit[];
  total: number;
  page: number;
  pageSize: number;
  stats: ConcordanceStats;
  books: BookFacet[];
};

const BOOK_META = new Map(BOOKS.map((b) => [b.id, b]));

export type SearchArgs = {
  query: string;
  testament?: "old" | "new" | null;
  book?: string | null;
  page?: number;
  pageSize?: number;
};

export async function searchConcordance({
  query,
  testament = null,
  book = null,
  page = 1,
  pageSize = 25,
}: SearchArgs): Promise<ConcordanceResult> {
  const q = query.trim();
  const empty: ConcordanceResult = {
    query: q,
    hits: [],
    total: 0,
    page: 1,
    pageSize,
    stats: null,
    books: [],
  };
  if (q.length < 2) return empty;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const safePage = Math.max(1, Math.min(400, Math.floor(page)));
  const offset = (safePage - 1) * pageSize;

  const [versesRes, booksRes, statsRes] = await Promise.all([
    supabaseAdmin.rpc("concordance_verses", {
      _query: q,
      _testament: testament ?? undefined,
      _book: book ?? undefined,
      _limit: pageSize,
      _offset: offset,
    }),
    supabaseAdmin.rpc("concordance_book_counts", { _query: q }),
    supabaseAdmin.rpc("concordance_term_stats", { _query: q }),
  ]);

  if (versesRes.error) throw new Error(versesRes.error.message);

  const rows = (versesRes.data ?? []) as {
    book: string;
    chapter: number;
    verse: number;
    text: string;
    testament: string;
    total_count: number;
  }[];

  const hits: ConcordanceHit[] = rows.map((r) => ({
    book: r.book,
    bookName: bookName(r.book),
    chapter: r.chapter,
    verse: r.verse,
    reference: `${bookName(r.book)} ${r.chapter}:${r.verse}`,
    text: r.text,
    testament: r.testament,
  }));

  const facets = ((booksRes.data ?? []) as {
    book: string;
    book_num: number;
    testament: string;
    hits: number;
  }[])
    .filter((f) => BOOK_META.has(f.book))
    .map((f) => ({
      book: f.book,
      bookName: bookName(f.book),
      bookNum: f.book_num,
      testament: f.testament,
      hits: Number(f.hits),
    }))
    .sort((a, b) => a.bookNum - b.bookNum);

  const statRow = ((statsRes.data ?? []) as {
    term: string;
    word: string;
    total: number;
    ot: number;
    nt: number;
    verses: number;
  }[])[0];

  return {
    query: q,
    hits,
    total: Number(rows[0]?.total_count ?? 0),
    page: safePage,
    pageSize,
    stats: statRow
      ? {
          term: statRow.term,
          word: statRow.word ?? statRow.term,
          total: statRow.total,
          ot: statRow.ot,
          nt: statRow.nt,
          verses: statRow.verses,
        }
      : null,
    books: facets,
  };
}

/** Word suggestions for the search box, ordered by how common the word is. */
export async function suggestTerms(prefix: string, limit = 8) {
  const p = prefix.trim().toLowerCase();
  if (p.length < 2) return [] as { word: string; total: number }[];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("concordance_terms")
    .select("word,total")
    .like("word", `${p}%`)
    .order("total", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? [])
    .filter((r): r is { word: string; total: number } => typeof r.word === "string")
    .map((r) => ({ word: r.word, total: r.total }));
}

/** Fire-and-forget logging so the landing page can show trending words. */
export async function logSearch(term: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("concordance_searches").insert({ term: term.toLowerCase() });
  } catch {
    // Analytics must never break a search.
  }
}

export async function trendingTerms(limit = 10) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString();
    const { data } = await supabaseAdmin
      .from("concordance_searches")
      .select("term")
      .gte("created_at", since)
      .limit(1000);
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const t = String(row.term ?? "").trim();
      if (t.length < 2) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([term, hits]) => ({ term, hits }));
  } catch {
    return [];
  }
}
