import { useCallback, useEffect, useState } from "react";
import { getBook } from "@/lib/bible";
import { loadChapterOffline } from "@/lib/chapter-query";
import { chapterKey, deleteStoredTranslation, storedChapterKeys } from "./chapter-store";
import {
  DEFAULT_TRANSLATION,
  LICENSED_TRANSLATION_IDS,
  isLicensedTranslation,
  type TranslationId,
} from "@/lib/translations";

/** Live set of chapter keys available on this device. */
export function useStoredChapters() {
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    // Safety net: purge any licensed text saved by an older build.
    const all = await storedChapterKeys();
    const stale = LICENSED_TRANSLATION_IDS.filter((id) =>
      all.some((k) => k.startsWith(`${id}:`)),
    );
    if (stale.length) {
      await Promise.all(stale.map((id) => deleteStoredTranslation(id)));
      setKeys(new Set(await storedChapterKeys()));
      return;
    }
    setKeys(new Set(all));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    keys,
    refresh,
    has: (book: string, chapter: number, translation: TranslationId = DEFAULT_TRANSLATION) =>
      keys.has(chapterKey(book, chapter, translation)),
  };
}

export type DownloadProgress = { done: number; total: number } | null;

/** Fetch and store every chapter of a book, three at a time. */
export function useBookDownload(onDone?: () => void) {
  const [progress, setProgress] = useState<DownloadProgress>(null);

  const download = useCallback(
    async (bookId: string, translation: TranslationId = DEFAULT_TRANSLATION) => {
      // Licensed texts are display-only; never bulk-save them.
      if (isLicensedTranslation(translation)) return;
      const book = getBook(bookId);
      if (!book || progress) return;
      const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);
      let done = 0;
      setProgress({ done, total: chapters.length });


      const queue = [...chapters];
      const worker = async () => {
        for (;;) {
          const c = queue.shift();
          if (!c) return;
          try {
            await loadChapterOffline(bookId, c, translation);
          } catch {
            /* skip chapters that fail; the rest still download */
          }
          done += 1;
          setProgress({ done, total: chapters.length });
        }
      };
      await Promise.all([worker(), worker(), worker()]);
      setProgress(null);
      onDone?.();
    },
    [onDone, progress],
  );

  return { progress, download };
}
