import { useChapterRoute } from "@/components/reader/use-chapter-route";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo } from "react";

import { bookName, stepChapter } from "@/lib/bible";
import { trackNav } from "@/lib/analytics/nav-events";
import { useStoredChapters } from "@/lib/offline/download";

import { useOnline } from "@/lib/offline/useOnline";
import { noteChapterRead, noteReadingMinutes } from "@/lib/offline/usage-tracker";
import { OfflineContext } from "./chrome/offline-context";
import { ReaderHeader } from "./chrome/ReaderHeader";
import { ReaderSidebar } from "./chrome/ReaderSidebar";
import { ChapterNavBar } from "./chrome/ChapterNavBar";
import { WhatsNewBanner } from "./chrome/WhatsNewBanner";
import { WhatsNewAnnouncement } from "./WhatsNewAnnouncement";

export { WhatsNewButton, WhatsNewNavLink } from "./chrome/WhatsNewBanner";

/** Layout shell for the reader: header, sidebar, banner and page content. */
export function ReaderChrome({
  book,
  chapter,
  children,
}: {
  book: string;
  chapter: number;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const chapterRoute = useChapterRoute();
  const prev = stepChapter(book, chapter, -1);
  const next = stepChapter(book, chapter, 1);
  const online = useOnline();
  const { keys: stored, refresh: refreshStored } = useStoredChapters();
  const offlineValue = useMemo(
    () => ({ online, stored, refreshStored }),
    [online, stored, refreshStored],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight" && next)
        navigate({ to: chapterRoute, params: { book: next.book, chapter: String(next.chapter) } });
      if (e.key === "ArrowLeft" && prev)
        navigate({ to: chapterRoute, params: { book: prev.book, chapter: String(prev.chapter) } });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, next, prev, chapterRoute]);

  // Newly-read chapters are stored in the background; keep the markers current.
  useEffect(() => {
    const t = setTimeout(refreshStored, 1200);
    return () => clearTimeout(t);
  }, [book, chapter, refreshStored]);

  // Usage signals for the offline-download prompt: a chapter counts once it
  // has been on screen for a few seconds, plus a minute-by-minute reading tick.
  useEffect(() => {
    const t = setTimeout(noteChapterRead, 8000);
    return () => clearTimeout(t);
  }, [book, chapter]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (document.visibilityState === "visible") noteReadingMinutes(1);
    }, 60_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (!online) trackNav("offline_mode_used", { book, chapter });
  }, [online, book, chapter]);

  return (
    <OfflineContext.Provider value={offlineValue}>
      <div className="min-h-screen bg-background">
        <ReaderHeader book={book} chapter={chapter} />

        <div className="flex">
          <ReaderSidebar book={book} chapter={chapter} />

          <main className="min-w-0 flex-1">
            <WhatsNewAnnouncement />
            <WhatsNewBanner />
            {children}
          </main>
          <ChapterNavBar book={book} chapter={chapter} />
        </div>
      </div>
    </OfflineContext.Provider>
  );
}

export function ChapterPager({ book, chapter }: { book: string; chapter: number }) {
  const chapterRoute = useChapterRoute();
  const prev = stepChapter(book, chapter, -1);
  const next = stepChapter(book, chapter, 1);
  return (
    <div className="mt-12 flex items-center justify-between gap-3 border-t pt-6">
      {prev ? (
        <Link
          to={chapterRoute}
          params={{ book: prev.book, chapter: String(prev.chapter) }}
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {bookName(prev.book)} {prev.chapter}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          to={chapterRoute}
          params={{ book: next.book, chapter: String(next.chapter) }}
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {bookName(next.book)} {next.chapter}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
