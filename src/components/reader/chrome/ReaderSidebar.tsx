import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BOOKS, SECTION_LABEL, SECTION_ORDER, matchBooks, type BookMeta } from "@/lib/bible";
import { chapterQuery } from "@/lib/chapter-query";
import { trackNav } from "@/lib/analytics/nav-events";
import { useSettings } from "../settings";
import { useOfflineLibrary } from "./offline-context";
import { WhatsNewNavLink } from "./WhatsNewBanner";


/** Verse numbers for the picked chapter, rendered inline under the chapter grid. */
function VerseRow({
  bookId,
  bookLabel,
  chapter,
  activeVerse,
  onNavigate,
}: {
  bookId: string;
  bookLabel: string;
  chapter: number;
  activeVerse?: number;
  onNavigate?: () => void;
}) {
  const { translation } = useSettings();
  const { data, isPending } = useQuery(chapterQuery(bookId, chapter, translation));
  // The chapter may already be cached on the server but not on the client, so
  // render the placeholder until hydration to keep both trees identical.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <div className="mx-1.5 mb-2 rounded-lg border bg-muted/30 p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          {bookLabel} {chapter} · verse
        </span>
        <Link
          to="/$book/$chapter"
          params={{ book: bookId, chapter: String(chapter) }}
          onClick={onNavigate}
          className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Whole chapter
        </Link>
      </div>
      {!hydrated || isPending ? (

        <div className="flex items-center gap-2 px-1 py-2 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Loading verses…
        </div>
      ) : !data?.verses?.length ? (
        <p className="px-1 py-2 text-[11px] text-muted-foreground">
          Verses aren’t available offline for this chapter yet.
        </p>
      ) : (
        <div className="grid grid-cols-6 gap-1" role="group" aria-label="Choose a verse">
          {data.verses.map((v) => (
            <Link
              key={v.number}
              to="/$book/$chapter/$verse"
              params={{ book: bookId, chapter: String(chapter), verse: String(v.number) }}
              onClick={() => {
                trackNav("verse_selected", { book: bookId, chapter, verse: v.number });
                trackNav("verse_navigation_completed", { book: bookId, chapter, verse: v.number });
                onNavigate?.();
              }}
              className={
                "scripture rounded-md py-1 text-center text-xs transition-colors " +
                (v.number === activeVerse
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground")
              }
            >
              {v.number}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ChapterGrid({
  b,
  book,
  chapter,
  verse,
  onNavigate,
}: {
  b: BookMeta;
  book: string;
  chapter: number;
  verse?: number;
  onNavigate?: () => void;
}) {
  const { online, stored } = useOfflineLibrary();
  const [expanded, setExpanded] = useState<number | null>(b.id === book ? chapter : null);

  useEffect(() => {
    setExpanded(b.id === book ? chapter : null);
  }, [b.id, book, chapter]);

  return (
    <div className="py-2">
      <div className="grid grid-cols-6 gap-1 px-1.5">
        {Array.from({ length: b.chapters }, (_, i) => i + 1).map((c) => {
          const saved = stored.has(`${b.id}:${c}`);
          const unavailable = !online && !saved;
          const isCurrent = b.id === book && c === chapter;
          const isOpen = expanded === c;
          return (
            <button
              key={c}
              type="button"
              aria-expanded={isOpen}
              onClick={() => {
                setExpanded(isOpen ? null : c);
                if (!isOpen) {
                  trackNav("chapter_selected", { book: b.id, chapter: c });
                  trackNav("verse_selector_opened", { book: b.id, chapter: c });
                }
              }}
              title={unavailable ? "Not saved on this device" : saved ? "Available offline" : undefined}
              className={
                "scripture relative rounded-md py-1 text-center text-xs transition-colors " +
                (isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isOpen
                    ? "bg-muted text-foreground"
                    : unavailable
                      ? "text-muted-foreground/35"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground") +
                (saved && !isCurrent ? " ring-1 ring-primary/25" : "")
              }
            >
              {c}
            </button>
          );
        })}
      </div>
      {expanded !== null && (
        <div className="mt-2">
          <VerseRow
            bookId={b.id}
            bookLabel={b.name}
            chapter={expanded}
            activeVerse={b.id === book && expanded === chapter ? verse : undefined}
            onNavigate={onNavigate}
          />
        </div>
      )}
    </div>
  );
}

export function BookNav({
  book,
  chapter,
  verse,
  onNavigate,
}: {
  book: string;
  chapter: number;
  verse?: number;
  onNavigate?: () => void;
}) {
  const [openBook, setOpenBook] = useState(book);
  const [filter, setFilter] = useState("");

  useEffect(() => setOpenBook(book), [book]);

  // The same matching rules the phone picker uses, so both always find the
  // same books from the same typing.
  const q = filter.trim();
  const matched = useMemo(() => matchBooks(filter), [filter]);


  const renderBook = (b: BookMeta) => {
    const expanded = openBook === b.id || (q.length > 0 && matched.length <= 3);
    return (
      <div key={b.id}>
        <button
          type="button"
          onClick={() => {
            setOpenBook(expanded ? "" : b.id);
            if (!expanded) trackNav("book_selected", { book: b.id });
          }}
          className={
            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-muted " +
            (b.id === book ? "font-semibold text-foreground" : "text-muted-foreground")
          }
        >
          <span>{b.name}</span>
          <span className="text-[10px] uppercase tracking-wide opacity-60">{b.chapters}</span>
        </button>
        {expanded && (
          <ChapterGrid b={b} book={book} chapter={chapter} verse={verse} onNavigate={onNavigate} />
        )}
      </div>
    );
  };

  return (
    <nav className="pb-16">
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Find a book…"
        aria-label="Filter books"
        className="mb-3 w-full rounded-lg border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/50"
      />
      <p className="mb-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
        Pick a book, then a chapter to choose an exact verse.
      </p>
      {q ? (
        <div className="space-y-1">
          {matched.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-muted-foreground">No book matches “{filter}”.</p>
          ) : (
            matched.map(renderBook)
          )}
        </div>
      ) : (
        SECTION_ORDER.map((section) => {
          const books = BOOKS.filter((b) => b.section === section);
          if (!books.length) return null;
          return (
            <section key={section} className="mb-4">
              <h3 className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                {SECTION_LABEL[section]}
              </h3>
              <div className="space-y-1">{books.map(renderBook)}</div>
            </section>
          );
        })
      )}
    </nav>
  );
}

/** Desktop sidebar with release-notes link and the full book list. */
export function ReaderSidebar({
  book,
  chapter,
  verse,
}: {
  book: string;
  chapter: number;
  verse?: number;
}) {
  return (
    <aside
      id="book-navigator"
      className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 overflow-y-auto border-r px-3 py-4 lg:block"
    >
      <div className="mb-4 space-y-2">
        <WhatsNewNavLink />
      </div>
      <BookNav book={book} chapter={chapter} verse={verse} />
    </aside>
  );
}
