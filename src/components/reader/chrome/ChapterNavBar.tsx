import { useChapterRoute } from "@/components/reader/use-chapter-route";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { bookName, stepChapter } from "@/lib/bible";
import { chapterQuery } from "@/lib/chapter-query";
import { useSettings } from "../settings";
import { ChapterSheet } from "./ChapterSheet";
import { useAudioBar } from "../audio-bar-context";
import { Button } from "@/components/ui/button";
import { Pause, Play, SlidersHorizontal, Loader2 } from "lucide-react";

const btn =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Slim previous · current · next bar pinned above the audio player. */
export function ChapterNavBar({ book, chapter }: { book: string; chapter: number }) {
  const chapterRoute = useChapterRoute();
  const prev = stepChapter(book, chapter, -1);
  const next = stepChapter(book, chapter, 1);
  const [open, setOpen] = useState(false);
  const [dim, setDim] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const qc = useQueryClient();
  const { translation } = useSettings();
  const { combined, bridge } = useAudioBar();
  const merged = combined && bridge !== null;

  // Warm the neighbours so stepping feels instant (cache/offline first).
  useEffect(() => {
    const t = setTimeout(() => {
      for (const n of [next, prev]) if (n) void qc.prefetchQuery(chapterQuery(n.book, n.chapter, translation));
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter, translation, qc]);

  // Publish height so content and prompts keep clear of the bar.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const set = () => root.style.setProperty("--chapter-nav-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--chapter-nav-h");
    };
  }, []);

  // Recede slightly while scrolling down; return on scroll up or pause.
  useEffect(() => {
    let last = window.scrollY;
    let t: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      const y = window.scrollY;
      setDim(y > last + 4);
      last = y;
      clearTimeout(t);
      t = setTimeout(() => setDim(false), 700);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, []);

  const label = `${bookName(book)} ${chapter}`;

  return (
    <>
      <nav
        ref={ref}
        aria-label="Chapter navigation"
        data-no-swipe
        className={
          "fixed inset-x-0 z-30 border-t bg-background/90 backdrop-blur-md transition-opacity duration-200 supports-[backdrop-filter]:bg-background/75 " +
          (dim ? "opacity-60" : "opacity-100")
        }
        style={{ bottom: "var(--audio-bar-h, 0px)" }}
      >
        <div className="mx-auto flex max-w-[38rem] items-center justify-between gap-1 px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:pb-1">
          {prev ? (
            <Link
              to={chapterRoute}
              params={{ book: prev.book, chapter: String(prev.chapter) }}
              className={btn}
              aria-label={`Previous: ${bookName(prev.book)} ${prev.chapter}`}
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            <span className={btn + " pointer-events-none opacity-30"} aria-hidden>
              <ChevronLeft className="h-5 w-5" />
            </span>
          )}
          {merged && <Button variant="default" size="icon" className="h-11 w-11 shrink-0 md:hidden" disabled={bridge.status !== "ready"} onClick={bridge.toggle} aria-label={bridge.playing ? "Pause chapter audio" : "Play chapter audio"}>{bridge.status === "loading" ? <Loader2 className="animate-spin" /> : bridge.playing ? <Pause /> : <Play />}</Button>}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={`${label}. Choose book and chapter`}
            className="inline-flex min-h-11 min-w-0 items-center gap-1 rounded-full px-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-4"
          >
            <span className="scripture truncate text-lg font-medium text-foreground">{label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </button>
          {next ? (
            <Link
              to={chapterRoute}
              params={{ book: next.book, chapter: String(next.chapter) }}
              className={btn}
              aria-label={`Next: ${bookName(next.book)} ${next.chapter}`}
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <span className={btn + " pointer-events-none opacity-30"} aria-hidden>
              <ChevronRight className="h-5 w-5" />
            </span>
          )}
          {merged && <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 md:hidden" onClick={() => bridge.setOptions(!bridge.options)} aria-label={bridge.options ? "Hide audio options" : "Show audio options"} aria-expanded={bridge.options}><SlidersHorizontal /></Button>}
        </div>
      </nav>
      <ChapterSheet open={open} onOpenChange={setOpen} book={book} chapter={chapter} />
    </>
  );
}
