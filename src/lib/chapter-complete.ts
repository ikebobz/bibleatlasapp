import { versesInChapter } from "./verse-counts.generated";

/**
 * True unless a chapter looks truncated. Versification genuinely differs
 * between Bibles (Synodal/Vulgate psalm numbering, Esther with or without the
 * Greek additions, paraphrases grouping verses into paragraphs), so comparing
 * against one canonical count rejects real chapters. The failure we must catch
 * is the upstream quirk that returns only verse 1 of a longer chapter
 * (e.g. "Philemon 1" read as Philemon 1:1).
 */
export function isChapterComplete(
  book: string,
  chapter: number,
  countOrVerses: number | readonly { number: number }[] | null | undefined,
): boolean {
  const reached =
    typeof countOrVerses === "number"
      ? countOrVerses
      : Math.max(0, countOrVerses?.length ?? 0, ...(countOrVerses ?? []).map((v) => v.number || 0));
  if (reached <= 0) return false;
  const expected = versesInChapter(book, chapter);
  if (reached === 1 && expected && expected >= 3) return false;
  return true;
}
