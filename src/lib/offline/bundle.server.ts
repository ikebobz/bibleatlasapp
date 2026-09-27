/**
 * Bulk KJV export for the on-device Bible.
 *
 * The whole KJV already lives in `bible_verses` (the concordance index), so a
 * full download reads from our own database instead of hammering the public
 * Bible API one chapter at a time.
 */

import { getBook, type Chapter } from "@/lib/bible";
import {
  DEFAULT_TRANSLATION,
  isLicensedTranslation,
  type TranslationId,
} from "@/lib/translations";

export type BookBundle = {
  book: string;
  chapters: Chapter[];
  verses: number;
};

const PAGE = 1000;

export async function loadKjvBooks(bookIds: string[]): Promise<BookBundle[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const out: BookBundle[] = [];

  for (const bookId of bookIds) {
    const meta = getBook(bookId);
    if (!meta) continue;

    const rows: { chapter: number; verse: number; text: string }[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabaseAdmin
        .from("bible_verses")
        .select("chapter,verse,text")
        .eq("book", meta.id)
        .order("chapter", { ascending: true })
        .order("verse", { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw new Error(error.message);
      const page = data ?? [];
      rows.push(...page);
      if (page.length < PAGE) break;
    }

    const byChapter = new Map<number, { number: number; text: string }[]>();
    for (const r of rows) {
      const list = byChapter.get(r.chapter) ?? [];
      list.push({ number: r.verse, text: r.text });
      byChapter.set(r.chapter, list);
    }

    const chapters: Chapter[] = [...byChapter.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([number, verses]) => ({
        book: meta.id,
        bookName: meta.name,
        chapter: number,
        reference: `${meta.name} ${number}`,
        verses,
      }));

    out.push({ book: meta.id, chapters, verses: rows.length });
  }

  return out;
}

/**
 * Any other translation is pulled chapter by chapter from the same open Bible
 * sources the reader uses, a few chapters at a time so a download never floods
 * the upstream API.
 */
async function loadBooksFromApi(
  bookIds: string[],
  translation: TranslationId,
): Promise<BookBundle[]> {
  const { loadChapter } = await import("@/lib/chapter.server");
  const out: BookBundle[] = [];

  for (const bookId of bookIds) {
    const meta = getBook(bookId);
    if (!meta) continue;
    const numbers = Array.from({ length: meta.chapters }, (_, i) => i + 1);
    const chapters: Chapter[] = [];
    for (let i = 0; i < numbers.length; i += 4) {
      const batch = numbers.slice(i, i + 4);
      const loaded = await Promise.all(
        batch.map((n) => loadChapter(meta.id, n, translation).catch(() => null)),
      );
      for (const c of loaded) if (c) chapters.push(c);
    }
    chapters.sort((a, b) => a.chapter - b.chapter);
    out.push({
      book: meta.id,
      chapters,
      verses: chapters.reduce((n, c) => n + c.verses.length, 0),
    });
  }

  return out;
}

/** Bulk export of whole books in one translation. */
export async function loadBooksBundle(
  bookIds: string[],
  translation: TranslationId = DEFAULT_TRANSLATION,
): Promise<BookBundle[]> {
  // Licensed texts (NIV, NKJV, MSG …) are display-only and online-only.
  // Enforced here on the server so the endpoint cannot be scripted for
  // bulk extraction, regardless of what the client UI allows.
  if (isLicensedTranslation(translation)) {
    throw new Error("This translation is licensed and cannot be downloaded for offline use.");
  }
  // The whole KJV already lives in our own database, so it never hits the API.
  if (translation === "kjv") return loadKjvBooks(bookIds);
  return loadBooksFromApi(bookIds, translation);
}

