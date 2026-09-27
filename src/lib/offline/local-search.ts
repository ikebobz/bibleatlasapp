/**
 * Full-text search over the Bible stored on this device.
 *
 * Used when the network is unavailable (or the online index fails), so the
 * downloaded KJV keeps search working with no connection at all.
 */

import { bookName, BOOKS } from "@/lib/bible";
import type { SearchHit } from "@/lib/search.server";
import { DEFAULT_TRANSLATION, type TranslationId } from "@/lib/translations";
import { countStoredChapters, readAllStoredChapters } from "./chapter-store";

const TOTAL_CHAPTERS = BOOKS.reduce((n, b) => n + b.chapters, 0);

/**
 * True when the whole Bible is on this device for that version, in which case
 * a local search is complete — faster than the network and free of API quota.
 */
export async function isFullyDownloaded(translation: TranslationId): Promise<boolean> {
  return (await countStoredChapters(translation)) >= TOTAL_CHAPTERS;
}

const ORDER = new Map(BOOKS.map((b) => [b.id, b.num]));

export async function searchStoredBible(
  query: string,
  translation: TranslationId = DEFAULT_TRANSLATION,
  limit = 25,
): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const terms = q.split(/\s+/).filter(Boolean);

  const chapters = await readAllStoredChapters(translation);
  chapters.sort(
    (a, b) => (ORDER.get(a.book) ?? 99) - (ORDER.get(b.book) ?? 99) || a.chapter - b.chapter,
  );

  const hits: SearchHit[] = [];
  for (const c of chapters) {
    for (const v of c.verses) {
      const text = v.text.toLowerCase();
      const match = text.includes(q) || terms.every((t) => text.includes(t));
      if (!match) continue;
      hits.push({
        book: c.book,
        bookName: bookName(c.book),
        chapter: c.chapter,
        verse: v.number,
        reference: `${bookName(c.book)} ${c.chapter}:${v.number}`,
        text: v.text,
      });
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}
