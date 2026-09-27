import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Map as MapIcon, Search } from "lucide-react";
import { useMemo, useState } from "react";

import {
  TIMELINE_ERAS,
  TIMELINE_ORDERED,
  searchTimeline,
} from "@/lib/timeline/events";

import { SITE_URL as SITE } from "@/lib/site";
import { LiveStatus, StateMessage } from "@/components/ui/state-message";

const TITLE = "Bible Timeline: Creation to Revelation | Bible Atlas";
const DESCRIPTION =
  "An interactive Bible timeline from creation to Revelation, with dates, eras and a link to the passage that records each event.";

export const Route = createFileRoute("/timeline")({
  head: () => {
    const url = `${SITE}/timeline`;
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: TITLE },
        { name: "twitter:description", content: DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Bible timeline",
            description: DESCRIPTION,
            url,
            numberOfItems: TIMELINE_ORDERED.length,
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            itemListElement: TIMELINE_ORDERED.map((e, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${e.date} — ${e.title}`,
              description: e.summary,
              url: `${SITE}/${e.link.book}/${e.link.chapter}${
                e.link.verse ? `/${e.link.verse}` : ""
              }`,
            })),
          }),
        },
      ],
    };
  },
  component: TimelinePage,
});

function TimelinePage() {
  const [query, setQuery] = useState("");
  const [era, setEra] = useState<string>("all");

  const results = useMemo(() => {
    const base = era === "all" ? TIMELINE_ORDERED : TIMELINE_ORDERED.filter((e) => e.era === era);
    return searchTimeline(query, base);
  }, [query, era]);

  const grouped = useMemo(
    () =>
      TIMELINE_ERAS.map((e) => ({ era: e, events: results.filter((ev) => ev.era === e.id) })).filter(
        (g) => g.events.length > 0,
      ),
    [results],
  );

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Bible Atlas
        </Link>
        <span className="px-1.5 opacity-50">/</span>
        <span className="text-foreground">Timeline</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Interactive Bible timeline
        </p>
        <h1 className="scripture mt-2 text-3xl leading-tight text-foreground sm:text-4xl">
          Bible timeline: creation to Revelation
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Every era of Scripture in order, from the first words of Genesis to the vision on Patmos.
          Search for a person or moment, filter by period, and open the exact passage that records
          it — the reading stays one tap away. Dates before the kings are traditional
          approximations; scholars place several of them centuries apart.
        </p>
      </header>

      <div className="mt-8 space-y-3">
        <label className="relative block">
          <span className="sr-only">Search the timeline</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, people or references"
            className="min-h-11 w-full rounded-full border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <EraChip active={era === "all"} onClick={() => setEra("all")} label="All eras" />
          {TIMELINE_ERAS.map((e) => (
            <EraChip
              key={e.id}
              active={era === e.id}
              onClick={() => setEra(e.id)}
              label={e.name}
            />
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <StateMessage kind="empty" title={`Nothing matches “${query}”`} description="Try a name, a place, or a book reference." className="mt-12" />
      ) : (
        grouped.map(({ era: e, events }) => (
          <section key={e.id} className="mt-12">
            <h2 className="scripture text-xl text-foreground">{e.name}</h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {e.span}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{e.blurb}</p>

            <ol className="mt-5 border-l pl-5">
              {events.map((ev) => (
                <li key={ev.id} className="relative pb-7 last:pb-0">
                  <span
                    className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-[var(--color-primary)]"
                    aria-hidden
                  />
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {ev.date}
                  </p>
                  <h3 className="scripture mt-0.5 text-lg text-foreground">{ev.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ev.summary}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <Link
                      to="/$book/$chapter"
                      params={{ book: ev.link.book, chapter: String(ev.link.chapter) }}
                      search={ev.link.verse ? { v: ev.link.verse } : {}}
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <BookOpen className="h-3 w-3" />
                      {ev.ref}
                    </Link>
                    {ev.journey && (
                      <Link
                        to="/journeys/$journey"
                        params={{ journey: ev.journey }}
                        search={{}}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <MapIcon className="h-3 w-3" />
                        View journey map for {ev.title}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
      <LiveStatus>{results.length} timeline event{results.length === 1 ? "" : "s"} shown</LiveStatus>

      <section className="mt-14 rounded-2xl border bg-card p-5">
        <h2 className="scripture text-xl text-foreground">Read the story, not just the dates</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Each entry opens in the reader, where places, people and journeys in the text stay live:
          tap one and a contextual panel opens beside the verse with a map, a timeline and the
          threads that run through the rest of Scripture.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/$book/$chapter"
            params={{ book: "genesis", chapter: "1" }}
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Start at Genesis 1
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/journeys"
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Explore interactive maps
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function EraChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 rounded-full border px-3 py-1 text-xs transition-colors ${
        active ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
