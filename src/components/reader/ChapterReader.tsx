import { useChapterRoute } from "@/components/reader/use-chapter-route";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { getBook, stepChapter } from "@/lib/bible";
import { useChapterSwipe } from "./chrome/chapter-swipe";
import { useVerseFocus } from "./useVerseFocus";
import { AtlasProvider, useAtlas } from "@/components/atlas/AtlasContext";
import { PanelBoundary, PanelSkeleton } from "@/components/PanelBoundary";
import { ChapterPager, ReaderChrome } from "./ReaderChrome";
import { Verse } from "./Verse";
import { VerseIndex, VerseLead, type VerseComparison } from "./VerseLead";

import { FirstRunTip } from "./FirstRunTip";
import { rememberPosition, useSettings } from "./settings";
import { chapterQuery } from "@/lib/chapter-query";
import { INDEX_BY_ID } from "@/lib/atlas/entry-index.generated";
import { chapterHasThreads } from "@/lib/threads/chapters.generated";
import { getTranslation, type TranslationId } from "@/lib/translations";
import { trackShare } from "@/lib/analytics/share-events";

// Both of these pull in large datasets (atlas entry content, the threads
// graph), so they stay out of the first reader chunk.
const AtlasPanel = lazy(() =>
  import("@/components/atlas/AtlasPanel").then((m) => ({ default: m.AtlasPanel })),
);
const ChapterThreads = lazy(() => import("./ChapterThreads"));


function ChapterBody({
  book,
  chapter,
  highlightVerse,
  versePath,
  comparisons,
}: {
  book: string;
  chapter: number;
  highlightVerse?: number;
  /** True when the verse is part of the URL path — renders the verse-first page. */
  versePath?: boolean;
  comparisons?: VerseComparison[];
}) {
  const { fontScale, lineHeight, quiet, translation } = useSettings();
  const { data } = useSuspenseQuery(chapterQuery(book, chapter, translation));
  const { stack } = useAtlas();
  const version = getTranslation(translation);
  const open = stack.length > 0;
  const versesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rememberPosition(book, chapter);
  }, [book, chapter]);

  // A fresh chapter starts at the top unless a verse is targeted.
  const order = (getBook(book)?.num ?? 0) * 1000 + chapter;
  const lastOrder = useRef(order);
  const [slide, setSlide] = useState<"" | "next" | "prev">("");
  useEffect(() => {
    if (lastOrder.current === order) return;
    setSlide(order > lastOrder.current ? "next" : "prev");
    lastOrder.current = order;
    if (!highlightVerse) window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const navigate = useNavigate();
  const chapterRoute = useChapterRoute();
  const go = useCallback(
    (dir: 1 | -1) => {
      const n = stepChapter(book, chapter, dir);
      if (n) navigate({ to: chapterRoute, params: { book: n.book, chapter: String(n.chapter) } });
    },
    [book, chapter, navigate, chapterRoute],
  );
  const onNext = useCallback(() => go(1), [go]);
  const onPrev = useCallback(() => go(-1), [go]);
  const swipeRef = useRef<HTMLDivElement>(null);
  useChapterSwipe(swipeRef, { onNext, onPrev, enabled: !open });

  useVerseFocus({
    book,
    chapter,
    verse: highlightVerse,
    containerRef: versesRef,
    ready: data,
  });

  const leadVerse =
    versePath && highlightVerse
      ? data.verses.find((v) => v.number === highlightVerse)
      : undefined;

  return (
    <div
      ref={swipeRef}
      key={order}
      className={
        (slide === "next" ? "animate-chapter-next " : slide === "prev" ? "animate-chapter-prev " : "") +
        "touch-pan-y px-5 pt-10 transition-[padding] duration-300 sm:px-8 " +
        (open ? "lg:pr-[472px]" : "") +
        (quiet ? " quiet" : "")
      }
      // Reserves room for the fixed audio bar, whose height varies with wrapping.
      style={{
        paddingBottom:
          "calc(var(--audio-bar-h, 0px) + var(--chapter-nav-h, 0px) + env(safe-area-inset-bottom, 0px) + 3rem)",
        scrollPaddingBottom:
          "calc(var(--audio-bar-h, 0px) + var(--chapter-nav-h, 0px) + env(safe-area-inset-bottom, 0px) + 2rem)",
      }}
    >
      <article className="mx-auto max-w-[38rem]">
        {leadVerse ? (
          <VerseLead
            bookId={data.book}
            bookName={data.bookName}
            chapter={data.chapter}
            verse={leadVerse.number}
            verseText={leadVerse.text}
            versionName={version.name}
            comparisons={comparisons}
          />
        ) : (
          <header className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {data.bookName}
            </p>
            <h1 className="scripture mt-1 text-4xl leading-none text-foreground">
              {data.bookName} {data.chapter}
            </h1>
            <p className="mt-3 text-xs text-muted-foreground">
              {version.name} · tap any highlighted word for context
            </p>
          </header>
        )}

        {chapterHasThreads(data.book, data.chapter) && (
          <PanelBoundary label="threads strip">
            <ChapterThreads book={data.book} chapter={data.chapter} />
          </PanelBoundary>
        )}


        <section aria-labelledby="chapter-text-heading">
          <h2
            id="chapter-text-heading"
            className={
              leadVerse
                ? "mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
                : "sr-only"
            }
          >
            {leadVerse
              ? `${data.bookName} ${data.chapter} — full chapter (${version.name})`
              : `${data.bookName} ${data.chapter} — Scripture text (${version.name})`}
          </h2>
          <div
            ref={versesRef}
            className="scripture text-foreground"
            style={{ fontSize: `${1.175 * fontScale}rem`, lineHeight }}
          >
            {data.verses.map((v) => (
              <Verse
                key={v.number}
                book={data.book}
                bookName={data.bookName}
                chapter={data.chapter}
                number={v.number}
                text={v.text}
                focused={highlightVerse === v.number}
              />
            ))}
          </div>
        </section>

        <VerseIndex
          bookId={data.book}
          bookName={data.bookName}
          chapter={data.chapter}
          verses={data.verses.map((v) => v.number)}
        />

        <section aria-labelledby="chapter-nav-heading">
          <h2 id="chapter-nav-heading" className="sr-only">
            Chapter navigation
          </h2>
          <ChapterPager book={book} chapter={chapter} />
        </section>

        {version.copyright && (
          <p className="mt-8 border-t pt-4 text-[11px] leading-relaxed text-muted-foreground">
            {version.copyright}
            {version.licence && (
              <>
                {" "}
                Licensed under{" "}
                <a
                  href={version.licence.url}
                  target="_blank"
                  rel="noreferrer noopener license"
                  className="underline underline-offset-2"
                >
                  {version.licence.name}
                </a>
                .
              </>
            )}
          </p>
        )}



      </article>
    </div>
  );
}


function ChapterFallback() {
  return (
    <div className="px-5 pb-24 pt-10 sm:px-8">
      <div className="mx-auto max-w-[38rem] space-y-3">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-4 w-full animate-pulse rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

/** Mounts the (lazily loaded) context panel only once something is open. */
function AtlasPanelMount() {
  const { stack } = useAtlas();
  if (stack.length === 0) return null;
  return (
    <PanelBoundary label="context panel" fallback={<PanelSkeleton />}>
      <AtlasPanel />
    </PanelBoundary>
  );
}



export function ChapterReader({
  book,
  chapter,
  initialRef,
  highlightVerse,
  versePath,
  comparisons,
  linkTranslation,
  sharedArrival,
  tour,
}: {
  book: string;
  chapter: number;
  initialRef?: string;
  highlightVerse?: number;
  /** True on `/book/chapter/verse` — renders the verse-first page. */
  versePath?: boolean;
  /** The same verse in other public-domain translations. */
  comparisons?: VerseComparison[];
  /** Translation carried on a shared link — applied once on arrival. */
  linkTranslation?: TranslationId;
  /** True when the visitor arrived via a shared link (`?s=share`). */
  sharedArrival?: boolean;
  /** True when the visitor arrived from the landing page (`?tour=1`). */
  tour?: boolean;
}) {

  const navigate = useNavigate();
  const chapterRoute = useChapterRoute();
  const { translation, update } = useSettings();

  // A shared link carries the sender's translation so the recipient reads the
  // very same words. Applied once, then it simply becomes their setting.
  useEffect(() => {
    if (linkTranslation && linkTranslation !== translation) update({ translation: linkTranslation });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkTranslation]);

  useEffect(() => {
    if (!sharedArrival) return;
    trackShare("link_opened", {
      resourceType: highlightVerse ? "verse" : "chapter",
      resourceRef: `${book} ${chapter}${highlightVerse ? `:${highlightVerse}` : ""}`,
      translation: linkTranslation ?? translation,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedArrival, book, chapter, highlightVerse]);

  return (
    <AtlasProvider
      initialEntryId={initialRef && INDEX_BY_ID[initialRef] ? initialRef : undefined}
      onTopChange={(entryId) => {
        navigate({
          to: ".",
          search: (prev: Record<string, unknown>) => ({ ...prev, ref: entryId }),
          replace: true,
          resetScroll: false,
        });
      }}
    >
      <ReaderChrome book={book} chapter={chapter}>
        {/* Remount on a version change so the new text replaces the old immediately. */}
        <Suspense key={translation} fallback={<ChapterFallback />}>
          <ChapterBody
            book={book}
            chapter={chapter}
            highlightVerse={highlightVerse}
            versePath={versePath}
            comparisons={comparisons}
          />

        </Suspense>

      </ReaderChrome>
      <AtlasPanelMount />
      <FirstRunTip fromTour={tour} />

    </AtlasProvider>
  );
}
