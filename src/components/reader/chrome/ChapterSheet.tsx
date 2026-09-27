import { useChapterRoute } from "@/components/reader/use-chapter-route";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import {
  BOOKS,
  SECTION_LABEL,
  SECTION_ORDER,
  getBook,
  matchBooks,
  type BookMeta,
  type CanonSection,
} from "@/lib/bible";
import { useOfflineLibrary } from "./offline-context";

/** Books in canon order, grouped under their section heading. */
function grouped(list: BookMeta[]) {
  return SECTION_ORDER.map((section: CanonSection) => ({
    section,
    books: list.filter((b) => b.section === section),
  })).filter((g) => g.books.length > 0);
}

/** Book → chapter picker, presented as a bottom sheet on phones. */
export function ChapterSheet({
  open,
  onOpenChange,
  book,
  chapter,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: string;
  chapter: number;
}) {
  const current = getBook(book);
  const chapterRoute = useChapterRoute();
  const [testament, setTestament] = useState<"old" | "new">(current?.testament ?? "old");
  const [picked, setPicked] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { online, stored } = useOfflineLibrary();

  const searching = query.trim().length > 0;
  const matches = useMemo(() => matchBooks(query), [query]);
  const visible = searching ? matches : BOOKS.filter((b) => b.testament === testament);
  // A handful of hits — "1 jn" — are quicker to read already open.
  const autoOpen = searching && matches.length > 0 && matches.length <= 3;

  useEffect(() => {
    if (!open) return;
    setTestament(getBook(book)?.testament ?? "old");
    setPicked(null);
    setQuery("");
    const t = setTimeout(() => {
      document.getElementById(`sheet-book-${book}`)?.scrollIntoView({ block: "center" });
    }, 60);
    return () => clearTimeout(t);
  }, [open, book]);

  // When a book expands, bring its row (and chapter grid) into view so the
  // full list 1…N is visible instead of opening below the fold.
  useEffect(() => {
    if (!picked) return;
    const id = requestAnimationFrame(() => {
      const row = document.getElementById(`sheet-book-${picked}`);
      const grid = row?.querySelector("ul");
      if (!row || !grid) return;
      const scroller = row.closest("[data-sheet-scroll]") as HTMLElement | null;
      if (!scroller) return;
      const sr = scroller.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      const gr = grid.getBoundingClientRect();
      // Fits? Only scroll enough to show the last row; otherwise align the book to the top.
      if (gr.bottom - rr.top <= sr.height) {
        if (gr.bottom > sr.bottom) scroller.scrollBy({ top: gr.bottom - sr.bottom + 8 });
        else if (rr.top < sr.top) scroller.scrollBy({ top: rr.top - sr.top });
      } else {
        scroller.scrollBy({ top: rr.top - sr.top });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [picked]);

  const rowCls = (b: { id: string }) =>
    "flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-left text-[15px] transition-colors hover:bg-muted " +
    (b.id === book ? "font-semibold text-primary" : "text-foreground");

  const renderBook = (b: BookMeta) => {
    const expanded = picked === b.id || autoOpen;
    return (
      <li key={b.id} id={`sheet-book-${b.id}`}>
        {b.chapters === 1 ? (
          <Link
            to={chapterRoute}
            params={{ book: b.id, chapter: "1" }}
            onClick={() => onOpenChange(false)}
            aria-current={b.id === book ? "page" : undefined}
            className={rowCls(b)}
          >
            {b.name}
            <span className="text-xs text-muted-foreground">1</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setPicked(expanded ? null : b.id)}
            aria-expanded={expanded}
            aria-current={b.id === book ? "true" : undefined}
            className={rowCls(b)}
          >
            {b.name}
            <ChevronDown
              className={"h-4 w-4 text-muted-foreground transition-transform " + (expanded ? "rotate-180" : "")}
              aria-hidden
            />
          </button>
        )}
        {expanded && (
          <ul
            aria-label={`${b.name} chapters`}
            className="grid grid-cols-5 gap-2 px-2 pb-3 pt-1 min-[400px]:grid-cols-6 sm:grid-cols-8"
          >
            {Array.from({ length: b.chapters }, (_, i) => i + 1).map((c) => {
              const active = b.id === book && c === chapter;
              const saved = stored.has(`${b.id}:${c}`);
              const unavailable = !online && !saved;
              return (
                <li key={c}>
                  <Link
                    to={chapterRoute}
                    params={{ book: b.id, chapter: String(c) }}
                    onClick={() => onOpenChange(false)}
                    aria-current={active ? "page" : undefined}
                    title={unavailable ? "Not saved on this device" : saved ? "Available offline" : undefined}
                    aria-label={unavailable ? `${b.name} ${c} — not saved on this device` : undefined}
                    className={
                      "relative flex aspect-square min-h-11 items-center justify-center rounded-lg text-sm tabular-nums transition-colors " +
                      (active
                        ? "bg-primary font-semibold text-primary-foreground"
                        : unavailable
                          ? "bg-muted/20 text-muted-foreground/35 hover:bg-muted"
                          : "bg-muted/50 text-foreground hover:bg-muted")
                    }
                  >
                    {c}
                    {saved && !active && (
                      <span className="absolute right-1.5 top-1.5 h-1 w-1 rounded-full bg-primary" aria-label="saved offline" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </li>
    );
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-foreground/30 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[85dvh] flex-col rounded-t-2xl border bg-background pb-[env(safe-area-inset-bottom)] shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom motion-reduce:animate-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[80vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-0"
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted sm:hidden" aria-hidden />
          <div className="flex items-center gap-2 px-4 pb-2 pt-2">
            <DialogPrimitive.Title className="scripture flex-1 text-xl text-foreground">Bible</DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 rounded-xl border bg-card px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPicked(null);
                }}
                placeholder="Find a book…"
                aria-label="Find a book"
                className="min-h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searching && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear book search"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
            {searching && (
              <p className="px-1 pt-1.5 text-[11px] text-muted-foreground">
                {matches.length} book{matches.length === 1 ? "" : "s"} in the whole Bible
              </p>
            )}
          </div>

          {!searching && (
            <div role="tablist" aria-label="Testament" className="mx-4 mb-2 grid grid-cols-2 rounded-full bg-muted p-1">
              {(["old", "new"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  type="button"
                  aria-selected={testament === t}
                  onClick={() => {
                    setTestament(t);
                    setPicked(null);
                  }}
                  className={
                    "min-h-10 rounded-full text-sm transition-colors " +
                    (testament === t ? "bg-background font-medium text-foreground shadow-sm" : "text-muted-foreground")
                  }
                >
                  {t === "old" ? "Old Testament" : "New Testament"}
                </button>
              ))}
            </div>
          )}

          <div data-sheet-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
            {visible.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                No book matches “{query.trim()}”.
              </p>
            ) : (
              grouped(visible).map(({ section, books }) => (
                <section key={section} className="mb-3">
                  <h3 className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                    {SECTION_LABEL[section]}
                  </h3>
                  <ul>{books.map(renderBook)}</ul>
                </section>
              ))
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
