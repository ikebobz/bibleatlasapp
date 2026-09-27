import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { ArrowRight, BookOpen, CalendarClock, Map as MapIcon, Waypoints } from "lucide-react";
import { useMemo } from "react";
import { z } from "zod";

import { ConcordanceSearch } from "@/components/concordance/ConcordanceSearch";
import { concordanceSearch } from "@/lib/concordance/search.functions";
import { atlasLinksFor, KIND_LABEL } from "@/lib/concordance/links";
import { slugToTerm, titleCase } from "@/lib/concordance/terms";

import { SITE_URL as SITE } from "@/lib/site";
import { LiveStatus, StateMessage } from "@/components/ui/state-message";

const searchSchema = z.object({
  page: fallback(z.number().int(), 1).default(1),
  book: fallback(z.string(), "").default(""),
  testament: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/concordance/$term")({
  validateSearch: zodValidator(searchSchema),
  head: ({ params }) => {
    const word = titleCase(slugToTerm(params.term));
    const title = `"${word}" in the Bible — Concordance | Bible Atlas`;
    const description = `Every KJV verse containing "${word}", with counts by book and testament, and the maps, timelines and connections behind the word.`;
    const url = `${SITE}/concordance/${params.term}`;
    return {
      meta: [
        { title: title.slice(0, 70) },
        { name: "description", content: description.slice(0, 158) },
        { property: "og:title", content: title.slice(0, 70) },
        { property: "og:description", content: description.slice(0, 158) },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title.slice(0, 70) },
        { name: "twitter:description", content: description.slice(0, 158) },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: TermPage,
});

function Bars({
  books,
}: {
  books: { book: string; bookName: string; hits: number; testament: string }[];
}) {
  const max = Math.max(1, ...books.map((b) => b.hits));
  return (
    <ul className="mt-3 space-y-1">
      {books.map((b) => (
        <li key={b.book} className="flex items-center gap-2">
          <Link
            to="/$book"
            params={{ book: b.book }}
            className="w-28 shrink-0 truncate text-[11px] text-muted-foreground hover:text-foreground"
          >
            {b.bookName}
          </Link>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className={
                "block h-full rounded-full " +
                (b.testament === "new" ? "bg-primary/70" : "bg-foreground/40")
              }
              style={{ width: `${Math.max(3, (b.hits / max) * 100)}%` }}
            />
          </span>
          <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
            {b.hits}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TermPage() {
  const { term } = Route.useParams();
  const { page, book, testament } = Route.useSearch();
  const navigate = useNavigate();
  const run = useServerFn(concordanceSearch);
  const word = slugToTerm(term);

  const { data, isFetching, isError } = useQuery({
    queryKey: ["concordance", word, page, book, testament],
    queryFn: () =>
      run({
        data: {
          query: word,
          page,
          book: book || null,
          testament: testament === "old" || testament === "new" ? testament : null,
        },
      }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 10,
  });

  const links = useMemo(() => atlasLinksFor(word), [word]);
  const stats = data?.stats ?? null;
  const display = titleCase(stats?.word ?? word);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const setSearch = (next: Partial<{ page: number; book: string; testament: string }>) =>
    void navigate({
      to: "/concordance/$term",
      params: { term },
      search: (prev) => ({ ...prev, ...next }),
    });

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Bible Atlas
        </Link>
        <span className="px-1.5 opacity-50">/</span>
        <Link to="/concordance" className="hover:text-foreground">
          Concordance
        </Link>
        <span className="px-1.5 opacity-50">/</span>
        <span className="text-foreground">{display}</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {links.kind ? `${KIND_LABEL[links.kind]} · King James Version` : "King James Version"}
        </p>
        <h1 className="scripture mt-2 text-3xl leading-tight text-foreground sm:text-4xl">
          “{display}” in the Bible
        </h1>
        {stats ? (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {stats.total.toLocaleString()} occurrence{stats.total === 1 ? "" : "s"} in{" "}
            {stats.verses.toLocaleString()} verse{stats.verses === 1 ? "" : "s"} —{" "}
            {stats.ot.toLocaleString()} in the Old Testament, {stats.nt.toLocaleString()} in the
            New. Word forms are grouped, so plurals and related endings are counted together.
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {isFetching ? "Searching…" : "No occurrences found for this word."}
          </p>
        )}
      </header>

      <div className="mt-7 max-w-xl">
        <ConcordanceSearch initial={word} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="results-heading">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="results-heading" className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Verses
            </h2>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {[
                { id: "", label: "Whole Bible" },
                { id: "old", label: "Old Testament" },
                { id: "new", label: "New Testament" },
              ].map((t) => (
                <button
                  key={t.id || "all"}
                  type="button"
                  onClick={() => setSearch({ testament: t.id, page: 1 })}
                  aria-pressed={testament === t.id}
                  className={
                    "rounded-full border px-3 py-1 text-[11px] transition-colors " +
                    (testament === t.id
                      ? "border-foreground/30 bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {book && (
            <button
              type="button"
              onClick={() => setSearch({ book: "", page: 1 })}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] text-foreground hover:bg-muted"
            >
              Filtered to {data?.books.find((b) => b.book === book)?.bookName ?? book} — clear
            </button>
          )}

          {isError ? <StateMessage kind="error" title="The concordance is unavailable" description="Please try this search again in a moment." compact className="mt-4" /> : null}

          {!isFetching && !isError && data?.hits.length === 0 ? <StateMessage kind="empty" title={`No verses found for “${display}”`} description="Try another word or clear the current filters." compact className="mt-4" /> : null}

          <ol className="mt-4 space-y-3">
            {(data?.hits ?? []).map((hit) => (
              <li key={`${hit.book}-${hit.chapter}-${hit.verse}`} className="rounded-2xl border bg-card p-4">
                <Link
                  to="/$book/$chapter/$verse"
                  params={{
                    book: hit.book,
                    chapter: String(hit.chapter),
                    verse: String(hit.verse),
                  }}
                  className="group block"
                >
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {hit.reference}
                  </span>
                  <p className="scripture mt-1.5 text-[15px] leading-relaxed text-foreground">
                    {hit.text}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground">
                    Read in context
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          {isFetching ? <StateMessage kind="loading" title="Loading verses…" compact className="mt-4" /> : null}
          <LiveStatus>{isFetching ? "Loading concordance verses" : data ? `${data.total} concordance results` : ""}</LiveStatus>

          {data && data.total > data.pageSize && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setSearch({ page: page - 1 })}
                className="min-h-11 rounded-full border px-4 py-1.5 text-xs text-foreground disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setSearch({ page: page + 1 })}
                className="min-h-11 rounded-full border px-4 py-1.5 text-xs text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>

        <aside className="space-y-8">
          {data && data.books.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Where it appears
              </h2>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tap a bar's book name to open it, or filter the verses below.
              </p>
              <Bars books={data.books} />
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {data.books.slice(0, 12).map((b) => (
                  <li key={b.book}>
                    <button
                      type="button"
                      onClick={() => setSearch({ book: b.book, page: 1 })}
                      className="rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {b.bookName} {b.hits}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {links.journeys.length > 0 && (
            <section>
              <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <MapIcon className="h-3.5 w-3.5" aria-hidden /> On the map
              </h2>
              <ul className="mt-3 space-y-2">
                {links.journeys.map((j) => (
                  <li key={j.id}>
                    <Link
                      to="/journeys/$journey"
                      params={{ journey: j.id }}
                      search={{}}
                      className="block rounded-xl border bg-card p-3 transition-colors hover:bg-muted"
                    >
                      <span className="block text-sm text-foreground">{j.title}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {j.tagline}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {links.timeline.length > 0 && (
            <section>
              <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden /> On the timeline
              </h2>
              <ul className="mt-3 space-y-2">
                {links.timeline.map((e) => (
                  <li key={e.id}>
                    <Link
                      to="/$book/$chapter"
                      params={{ book: e.book, chapter: String(e.chapter) }}
                      className="block rounded-xl border bg-card p-3 transition-colors hover:bg-muted"
                    >
                      <span className="block text-[11px] text-muted-foreground">{e.date}</span>
                      <span className="mt-0.5 block text-sm text-foreground">{e.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/timeline"
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Open the full timeline <ArrowRight className="h-3 w-3" />
              </Link>
            </section>
          )}

          {links.nodes.length > 0 && (
            <section>
              <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Waypoints className="h-3.5 w-3.5" aria-hidden /> Thematic connections
              </h2>
              <ul className="mt-3 space-y-2">
                {links.nodes.map((n) => (
                  <li key={n.id}>
                    <Link
                      to="/connections/$node"
                      params={{ node: n.id }}
                      className="block rounded-xl border bg-card p-3 transition-colors hover:bg-muted"
                    >
                      <span className="block text-sm text-foreground">{n.label}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{n.ref}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border bg-card p-4">
            <h2 className="flex items-center gap-1.5 text-sm text-foreground">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              Keep reading
            </h2>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              Every verse above opens in the reader with its contextual panels intact.
            </p>
            {data?.hits[0] && (
              <Link
                to="/$book/$chapter/$verse"
                params={{
                  book: data.hits[0].book,
                  chapter: String(data.hits[0].chapter),
                  verse: String(data.hits[0].verse),
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                Open {data.hits[0].reference}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </section>
        </aside>
      </div>

      <p className="mt-14 text-[11px] text-muted-foreground">
        Concordance data indexed from the public-domain King James Version.{" "}
        <Link to="/concordance" className="underline hover:text-foreground">
          Search another word
        </Link>
      </p>
    </main>
  );
}
