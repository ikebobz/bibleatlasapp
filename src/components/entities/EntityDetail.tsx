import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Landmark,
  Map as MapIcon,
  ScrollText,
  Users,
  Waypoints,
} from "lucide-react";
import { useMemo } from "react";

import { atlasLinksFor } from "@/lib/concordance/links";
import { termSlug } from "@/lib/concordance/terms";
import type { ConcordanceResult } from "@/lib/concordance/search.server";
import { entityBySlug, type Entity } from "@/lib/entities/registry";
import type { CuratedPerson, CuratedPlace } from "@/lib/entities/copy";
import { mapPlaceIdForEntity } from "@/lib/atlas/catalogue";
import { familyTreeFor } from "@/lib/entities/family-trees";

/** Only link onward to entities that actually have a written page. */
function resolve(type: "person" | "place", slugs: string[] | undefined) {
  return (slugs ?? [])
    .map((slug) => entityBySlug(type, slug))
    .filter((e): e is Entity => Boolean(e?.published));
}


function Bars({ books }: { books: ConcordanceResult["books"] }) {
  const max = Math.max(1, ...books.map((b) => b.hits));
  return (
    <ul className="mt-3 space-y-1">
      {books.slice(0, 14).map((b) => (
        <li key={b.book} className="flex items-center gap-2">
          <Link
            to="/$book"
            params={{ book: b.book }}
            className="w-24 shrink-0 truncate text-[11px] text-muted-foreground hover:text-foreground"
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
          <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
            {b.hits}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function EntityDetail({
  entity,
  data,
  page,
}: {
  entity: Entity;
  data: ConcordanceResult | null;
  page: number;
}) {
  const person = entity.type === "person" ? (entity.curated as CuratedPerson | null) : null;
  const place = entity.type === "place" ? (entity.curated as CuratedPlace | null) : null;
  const links = useMemo(() => atlasLinksFor(entity.search), [entity.search]);

  const kicker = person
    ? [person.role, person.era].filter(Boolean).join(" · ")
    : [place?.region, place?.modern && `Today: ${place.modern}`].filter(Boolean).join(" · ");

  const hub = entity.type === "person" ? "People" : "Places";
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const first = data?.hits[0];
  const mapPlaceId =
    entity.type === "place" ? mapPlaceIdForEntity(entity) : person?.mapPlace;
  const relatedPeople = useMemo(() => resolve("person", person?.people), [person]);
  const relatedPlaces = useMemo(() => resolve("place", person?.places), [person]);
  const passages = person?.passages ?? [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-14">
      <nav className="mb-8 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">
          Bible Atlas
        </Link>
        <span className="px-1.5 opacity-50">/</span>
        {entity.type === "person" ? (
          <Link to="/people" className="hover:text-foreground">
            {hub}
          </Link>
        ) : (
          <Link to="/places" className="hover:text-foreground">
            {hub}
          </Link>
        )}
        <span className="px-1.5 opacity-50">/</span>
        <span className="text-foreground">{entity.name}</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {kicker || (entity.type === "person" ? "Person in the Bible" : "Place in the Bible")}
        </p>
        <h1 className="scripture mt-2 text-3xl leading-tight text-foreground sm:text-4xl">
          {entity.name} in the Bible
        </h1>
        {entity.aliases.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Also called {entity.aliases.join(", ")}
          </p>
        )}
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          {entity.curated?.summary ??
            `${entity.name} appears in the King James text of Scripture. Every verse below is linked to its chapter, so you can read the surrounding passage with maps, timelines and connections alongside it.`}
        </p>
        {place?.archaeology && (
          <div className="mt-5 rounded-2xl border bg-card p-4">
            <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <Landmark className="h-3.5 w-3.5" /> Archaeology
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{place.archaeology}</p>
          </div>
        )}
        {person?.certainty && (
          <div className="mt-5 rounded-2xl border bg-card p-4">
            <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <Landmark className="h-3.5 w-3.5" /> What Scripture says, and what it leaves open
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{person.certainty}</p>
          </div>
        )}
      </header>

      {mapPlaceId && (
        <section className="mt-8" aria-labelledby="place-map-heading">
          <p className="text-[10px] font-semibold uppercase text-primary">Geographic context</p>
          <h2 id="place-map-heading" className="scripture mt-1 text-xl text-foreground">
            {entity.type === "person" ? `Where ${entity.name} belongs on the map` : `${entity.name} on the map`}
          </h2>
          <Link
            to="/maps"
            search={{ place: mapPlaceId, from: `${entity.type === "place" ? "places" : "people"}/${entity.slug}` }}
            className="mt-3 flex items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 transition-colors hover:bg-muted"
          >
            <MapIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="flex-1">
              <span className="block text-sm font-medium text-foreground">
                Open {entity.name} on the interactive map
              </span>
              <span className="block text-xs text-muted-foreground">
                Real terrain, nearby places, journeys and passages
              </span>
            </span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </section>
      )}

      {entity.type === "person" && familyTreeFor(entity.slug) && (
        <p className="mt-6">
          <Link
            to="/people/$slug/family-tree"
            params={{ slug: entity.slug }}
            className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm text-foreground hover:bg-muted"
          >
            {entity.name}’s family tree
          </Link>
        </p>
      )}

      {passages.length > 0 && (
        <section className="mt-8" aria-labelledby="passages-heading">
          <h2
            id="passages-heading"
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            <ScrollText className="h-3.5 w-3.5" /> Key passages
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {passages.map((p) => (
              <li key={p.reference}>
                <Link
                  to="/$book/$chapter"
                  params={{ book: p.book, chapter: String(p.chapter) }}
                  className="flex min-h-11 items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted"
                >
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-foreground">{p.reference}</span>
                    {p.note && (
                      <span className="block text-xs text-muted-foreground">{p.note}</span>
                    )}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(relatedPeople.length > 0 || relatedPlaces.length > 0) && (
        <section className="mt-8" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            <Users className="h-3.5 w-3.5" /> Related people and places
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedPeople.map((p) => (
              <Link
                key={`person-${p.slug}`}
                to="/people/$slug"
                params={{ slug: p.slug }}
                search={{}}
                className="inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-xs text-foreground hover:bg-muted"
              >
                {p.name}
              </Link>
            ))}
            {relatedPlaces.map((p) => (
              <Link
                key={`place-${p.slug}`}
                to="/places/$slug"
                params={{ slug: p.slug }}
                search={{}}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-xs text-foreground hover:bg-muted"
              >
                <MapIcon className="h-3 w-3 text-muted-foreground" aria-hidden />
                {p.name}
              </Link>
            ))}
          </div>
        </section>
      )}



      <div className="mt-8 flex flex-wrap gap-2">
        {first && (
          <Link
            to="/$book/$chapter/$verse"
            params={{
              book: first.book,
              chapter: String(first.chapter),
              verse: String(first.verse),
            }}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Read the first mention — {first.reference}
          </Link>
        )}
        <Link
          to="/concordance/$term"
          params={{ term: termSlug(entity.search) }}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs text-foreground hover:bg-muted"
        >
          Search every form of “{entity.search}”
        </Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section aria-labelledby="verses-heading">
          <h2
            id="verses-heading"
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Verses mentioning {entity.name}
          </h2>
          {data?.stats ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {data.stats.total.toLocaleString()} occurrence
              {data.stats.total === 1 ? "" : "s"} across{" "}
              {data.stats.verses.toLocaleString()} verse{data.stats.verses === 1 ? "" : "s"} in the
              King James Version.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No King James verses are indexed under this name yet.
            </p>
          )}
          {person?.versesNote && (
            <p className="mt-1.5 text-xs text-muted-foreground">{person.versesNote}</p>
          )}

          <ol className="mt-4 space-y-2 sm:space-y-3">
            {(data?.hits ?? []).map((hit) => (
              <li
                key={`${hit.book}-${hit.chapter}-${hit.verse}`}
                className="rounded-lg border bg-card p-3 sm:p-4"
              >
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
                    Read in context <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          {data && data.total > data.pageSize && (
            <div className="mt-6 flex items-center justify-between gap-3">
              {page > 1 ? (
                <Link
                  to={entity.type === "person" ? "/people/$slug" : "/places/$slug"}
                  params={{ slug: entity.slug }}
                  search={{ page: page - 1 === 1 ? undefined : page - 1 }}
                  className="inline-flex min-h-11 items-center rounded-full border px-4 py-1.5 text-xs text-foreground"
                  rel="prev"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-[11px] tabular-nums text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  to={entity.type === "person" ? "/people/$slug" : "/places/$slug"}
                  params={{ slug: entity.slug }}
                  search={{ page: page + 1 }}
                  className="inline-flex min-h-11 items-center rounded-full border px-4 py-1.5 text-xs text-foreground"
                  rel="next"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </section>

        <aside className="space-y-8">
          {data && data.books.length > 0 && (
            <section aria-labelledby="books-heading">
              <h2
                id="books-heading"
                className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Where it appears
              </h2>
              <Bars books={data.books} />
            </section>
          )}

          {links.journeys.length > 0 && (
            <section aria-labelledby="journeys-heading">
              <h2
                id="journeys-heading"
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                <MapIcon className="h-3.5 w-3.5" /> Journeys
              </h2>
              <ul className="mt-3 space-y-2">
                {links.journeys.map((j) => (
                  <li key={j.id}>
                    <Link
                      to="/journeys/$journey"
                      params={{ journey: j.id }}
                      className="block rounded-xl border p-3 text-sm hover:bg-muted"
                    >
                      <span className="block font-medium text-foreground">{j.title}</span>
                      <span className="block text-xs text-muted-foreground">{j.tagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {links.timeline.length > 0 && (
            <section aria-labelledby="timeline-heading">
              <h2
                id="timeline-heading"
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                <CalendarClock className="h-3.5 w-3.5" /> Timeline
              </h2>
              <ul className="mt-3 space-y-2">
                {links.timeline.map((e) => (
                  <li key={e.id}>
                    <Link
                      to="/$book/$chapter"
                      params={{ book: e.book, chapter: String(e.chapter) }}
                      className="block rounded-xl border p-3 text-sm hover:bg-muted"
                    >
                      <span className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                        {e.date}
                      </span>
                      <span className="block font-medium text-foreground">{e.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {links.nodes.length > 0 && (
            <section aria-labelledby="threads-heading">
              <h2
                id="threads-heading"
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                <Waypoints className="h-3.5 w-3.5" /> Connections
              </h2>
              <ul className="mt-3 space-y-2">
                {links.nodes.map((n) => (
                  <li key={n.id}>
                    <Link
                      to="/connections/$node"
                      params={{ node: n.id }}
                      search={{ from: `${entity.type === "person" ? "people" : "places"}/${entity.slug}` }}
                      className="block rounded-xl border p-3 text-sm hover:bg-muted"
                    >
                      <span className="block font-medium text-foreground">{n.label}</span>
                      <span className="block text-xs text-muted-foreground">{n.ref}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
