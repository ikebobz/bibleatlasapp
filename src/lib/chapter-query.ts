import { queryOptions } from "@tanstack/react-query";
import { getChapter } from "./chapter.functions";
import type { Chapter } from "./bible";
import { readStoredChapter, writeStoredChapter } from "./offline/chapter-store";
import {
  DEFAULT_TRANSLATION,
  isLicensedTranslation,
  type TranslationId,
} from "./translations";

export type ChapterUnavailableReason = "not-downloaded" | "network";

/**
 * Thrown when a chapter can be served neither from the device nor the network,
 * carrying enough detail for the reader to explain *why*.
 */
export class ChapterUnavailableError extends Error {
  readonly reason: ChapterUnavailableReason;
  readonly translation: TranslationId;

  constructor(reason: ChapterUnavailableReason, translation: TranslationId, cause?: unknown) {
    super(
      reason === "not-downloaded"
        ? "This version has not been downloaded for offline reading."
        : "This chapter could not be loaded.",
    );
    this.name = "ChapterUnavailableError";
    this.reason = reason;
    this.translation = translation;
    if (cause instanceof Error) this.cause = cause;
  }
}

/** Reads a thrown loader error back, tolerating SSR-serialised copies. */
export function chapterErrorReason(error: unknown): ChapterUnavailableReason | null {
  if (!error || typeof error !== "object") return null;
  const reason = (error as { reason?: unknown }).reason;
  return reason === "not-downloaded" || reason === "network" ? reason : null;
}

/**
 * The single door to chapter text.
 *
 * Downloaded chapters are served from the device first — no request, no
 * spinner, no API quota — and anything missing is fetched and written back so
 * the next visit is local. Licensed translations (NIV, MSG …) are exempt:
 * their licence allows online display only, so nothing is ever persisted.
 */
export async function loadChapterOffline(
  book: string,
  chapter: number,
  translation: TranslationId = DEFAULT_TRANSLATION,
): Promise<Chapter> {
  if (isLicensedTranslation(translation)) {
    return (await getChapter({ data: { book, chapter, translation } })) as Chapter;
  }

  const stored = await readStoredChapter(book, chapter, translation);
  if (stored) return stored;

  try {
    const fresh = (await getChapter({ data: { book, chapter, translation } })) as Chapter;
    void writeStoredChapter(fresh, translation);
    return fresh;
  } catch (error) {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    throw new ChapterUnavailableError(offline ? "not-downloaded" : "network", translation, error);
  }
}


export const chapterQuery = (
  book: string,
  chapter: number,
  translation: TranslationId = DEFAULT_TRANSLATION,
) =>
  queryOptions({
    queryKey: ["chapter", translation, book, chapter],
    queryFn: () => loadChapterOffline(book, chapter, translation),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    // Locally stored chapters must resolve even when the browser is offline;
    // React Query would otherwise pause the query.
    networkMode: "always",
    retry: false,
  });
