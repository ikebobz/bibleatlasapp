/**
 * Parses a Bible Atlas deep link back into the reader state it encodes.
 *
 * Mirrors the route definitions in `src/routes/$book.$chapter.tsx` and
 * `src/routes/$book.$chapter.$verse.tsx`: the verse in the path is the
 * highlighted verse, and a legacy `?v=` on a chapter link highlights too.
 */

import { getBook } from "./bible";
import { DEFAULT_TRANSLATION, type TranslationId } from "./translations";

export type DeepLink = {
  origin: string;
  book: string;
  chapter: number;
  /** The verse the reader scrolls to and highlights, if any. */
  highlightVerse?: number;
  /** True when the verse is part of the path (permanent verse link). */
  verseInPath: boolean;
  translation: TranslationId;
  entryId?: string;
  fromShare: boolean;
};

export function parseDeepLink(href: string): DeepLink | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const [bookId, chapterRaw, verseRaw] = url.pathname.replace(/^\/+/, "").split("/");
  if (!bookId || !chapterRaw) return null;
  const book = getBook(bookId);
  const chapter = Number(chapterRaw);
  if (!book || !Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) return null;

  const pathVerse = verseRaw ? Number(verseRaw) : NaN;
  const queryVerse = url.searchParams.get("v") ? Number(url.searchParams.get("v")) : NaN;
  const verseInPath = Number.isFinite(pathVerse) && pathVerse >= 1;
  const highlightVerse = verseInPath
    ? pathVerse
    : Number.isFinite(queryVerse) && queryVerse >= 1
      ? queryVerse
      : undefined;

  return {
    origin: url.origin,
    book: book.id,
    chapter,
    highlightVerse,
    verseInPath,
    translation: (url.searchParams.get("t") as TranslationId | null) ?? DEFAULT_TRANSLATION,
    entryId: url.searchParams.get("ref") ?? undefined,
    fromShare: url.searchParams.get("s") === "share",
  };
}
