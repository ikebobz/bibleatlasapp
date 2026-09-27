/**
 * Durable, server-side chapter fallback.
 *
 * The public Bible APIs rate-limit shared server IPs (HTTP 429), which used to
 * surface as "Could not load … right now". Every successful public-domain
 * chapter is therefore mirrored into `chapter_cache`, and the full KJV already
 * lives in `bible_verses` (ingested for the concordance), so a provider outage
 * degrades to slightly staler text instead of a broken page.
 */

import type { TranslationId } from "./translations";
import { isChapterComplete } from "./chapter-complete";

export type Verses = { number: number; text: string }[];

/** Last-known-good text for this chapter, or null when we have never stored it. */
export async function readCachedChapter(
  translation: TranslationId,
  book: string,
  chapter: number,
): Promise<Verses | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("chapter_cache")
      .select("verses")
      .eq("translation", translation)
      .eq("book", book)
      .eq("chapter", chapter)
      .maybeSingle();
    const verses = data?.verses as Verses | undefined;
    if (Array.isArray(verses) && verses.length && isChapterComplete(book, chapter, verses)) return verses;

    // The concordance index is the KJV in full — a complete offline-grade source.
    if (translation === "kjv") {
      const { data: rows } = await supabaseAdmin
        .from("bible_verses")
        .select("verse, text")
        .eq("book", book)
        .eq("chapter", chapter)
        .order("verse", { ascending: true });
      if (rows?.length) return rows.map((r) => ({ number: r.verse, text: r.text }));
    }
    return null;
  } catch {
    return null;
  }
}

/** Mirror a freshly fetched chapter so the next outage can be served from here. */
export async function writeCachedChapter(
  translation: TranslationId,
  book: string,
  chapter: number,
  verses: Verses,
): Promise<void> {
  if (!isChapterComplete(book, chapter, verses)) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("chapter_cache")
      .upsert(
        { translation, book, chapter, verses, updated_at: new Date().toISOString() },
        { onConflict: "translation,book,chapter" },
      );
  } catch {
    /* the cache is best-effort */
  }
}
