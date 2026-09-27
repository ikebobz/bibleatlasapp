import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Highlighter, Share2, Trash2 } from "lucide-react";
import { HIGHLIGHT_COLORS, useHighlights, type HighlightColor } from "@/lib/highlights";
import { ShareSheet } from "@/components/reader/ShareSheet";
import { shareVerse, type VerseShare } from "@/lib/share";
import { useState } from "react";
import { SITE_URL as SITE } from "@/lib/site";
import { LiveStatus, StateMessage } from "@/components/ui/state-message";


export const Route = createFileRoute("/highlights")({
  head: () => {
    const title = "My highlights — Bible Atlas";
    const description =
      "Every verse you have highlighted, colour-coded and grouped by book, ready to revisit and re-read.";
    const url = `${SITE}/highlights`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: HighlightsPage,
});

function HighlightsPage() {
  const { list, remove, clear } = useHighlights();
  const [filter, setFilter] = useState<HighlightColor | "all">("all");
  const [share, setShare] = useState<{ verse: VerseShare; rect: DOMRect } | null>(null);
  const shown = filter === "all" ? list : list.filter((h) => h.color === filter);


  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 px-4 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight">Bible Atlas</span>
          </Link>
          <span className="ml-auto text-xs text-muted-foreground">
            {list.length} highlight{list.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <h1 className="scripture flex items-center gap-2 text-3xl text-foreground">
          <Highlighter className="h-6 w-6 text-primary" />
          My highlights
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap a verse number while reading to colour it. Everything you mark is saved on this
          device and gathered here.
        </p>

        <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Filter by colour
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`min-h-11 rounded-full border px-3 py-1 text-xs transition-colors ${
              filter === "all" ? "border-primary text-primary" : "text-muted-foreground"
            }`}
          >
            All
          </button>
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`hl-${c.id} inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                filter === c.id ? "border-primary text-primary" : "text-muted-foreground"
              }`}
            >
              <span className={`hl-swatch hl-${c.id} h-2.5 w-2.5 rounded-full border`} />
              {c.label}
            </button>
          ))}
          {list.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="ml-auto min-h-11 px-2 text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              Clear all
            </button>
          )}
        </div>

        <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Saved verses
        </h2>

        {shown.length === 0 ? (
          <StateMessage kind="empty" title={list.length ? "No highlights match this colour" : "No highlights yet"} description={list.length ? "Choose another colour to see your saved verses." : "Open any chapter and tap a verse number to mark it."} className="mt-4" />
        ) : (
          <ul className="mt-4 space-y-3">
            {shown.map((h) => (
              <li
                key={`${h.book}.${h.chapter}.${h.verse}`}
                className={`hl-${h.color} group rounded-xl border p-4`}
              >
                <div className="flex items-center gap-2">
                  <span className={`hl-swatch hl-${h.color} h-2.5 w-2.5 rounded-full border`} />
                  <Link
                    to="/$book/$chapter"
                    params={{ book: h.book, chapter: String(h.chapter) }}
                    search={{ v: h.verse }}
                    className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary"
                  >
                    {h.bookName} {h.chapter}:{h.verse}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Share ${h.bookName} ${h.chapter}:${h.verse}`}
                    onClick={(e) => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const verse: VerseShare = {
                        book: h.book,
                        chapter: h.chapter,
                        verse: h.verse,
                        text: h.text,
                        reference: `${h.bookName} ${h.chapter}:${h.verse}`,
                      };
                      void shareVerse(verse).then((done) => {
                        if (!done) setShare({ verse, rect });
                      });
                    }}
                    className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove highlight"
                    onClick={() => remove(h.book, h.chapter, h.verse)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                </div>
                <p className="scripture verse-highlight mt-2 inline text-[1.05rem] leading-relaxed text-foreground">
                  {h.text}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
      {share && (
        <ShareSheet verse={share.verse} rect={share.rect} onClose={() => setShare(null)} />
      )}
      <LiveStatus>{shown.length} highlighted verse{shown.length === 1 ? "" : "s"} shown</LiveStatus>
    </div>

  );
}
