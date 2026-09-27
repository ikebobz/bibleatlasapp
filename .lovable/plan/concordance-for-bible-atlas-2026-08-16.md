# Concordance for Bible Atlas

A searchable index of the whole KJV, wired into the Atlas knowledge graph so a word search ends in Scripture, not in a dictionary.

## What the user gets

**`/concordance`** — landing page with a big search box, type-ahead suggestions, and curated shelves: popular searches, recent searches (stored on the device), featured terms, most-searched people, most-searched places, and themes. Example chips: faith, love, covenant, kingdom, Jerusalem, David, Messiah, grace.

**`/concordance/{term}`** — a shareable results page showing:

- The term, total occurrence count, and the Old vs New Testament split
- Occurrences by book (simple horizontal bars) and, when one book dominates, occurrences by chapter
- The full verse list, paginated, each with reference, verse text, and a one-line surrounding-context preview
- Filters: testament, section (Law / History / Wisdom / Prophets / Gospels / Letters), and specific book
- Related terms, and — when the term matches an Atlas person, place, journey, theme or timeline era — an "Explore in Atlas" rail

**Clicking a verse** opens the reader at `/{book}/{chapter}/{verse}`, which already scrolls to and focuses that verse. Back navigation returns to the results, scroll position intact.

**Atlas integration.** A term that resolves to Atlas data gets contextual cards above the verse list:

- Jerusalem → map, modern location, related journeys, associated people, timeline events
- Paul → profile entry, missionary journey maps, timeline, associated cities and letters
- David → profile entry, family tree, timeline events, associated places, related Psalms
- faith / covenant / grace → related thread nodes and walkthroughs, plus "how the word is used" groupings (Torah, Prophets, Gospels, Paul's letters, Hebrews and the rest) so development across Scripture is visible

No AI calls anywhere in this feature. Original-language data is out of scope for this round.

## How search stays instant

The KJV text is loaded into the backend once, then searched with a database index — nothing scans the Bible at request time.

```text
one-time ingest (1,189 chapters, existing upstream)
        -> bible_verses table (KJV, ~31k rows, full-text index)
        -> concordance_terms table (word -> total, per-book counts)
             -> suggestions + counts served instantly
             -> verse pages served paginated from bible_verses
```

## Technical plan

**Database (migration)**

- `public.bible_verses(book text, chapter int, verse int, text text, testament text, book_num int, tsv tsvector generated)` — PK `(book, chapter, verse)`, GIN index on `tsv`, btree on `(book, chapter)`. `GRANT SELECT` to `anon`/`authenticated`, `GRANT ALL` to `service_role`; RLS on with a public read policy.
- `public.concordance_terms(term text primary key, total int, ot int, nt int, per_book jsonb)` — same grant/RLS shape; drives counts, suggestions and shelves without touching the verse table.
- `public.concordance_searches(term, device_id, created_at)` for the "most searched" shelves and analytics; insert-only for `anon`.

**Ingest** — `src/routes/api/public/concordance/ingest.ts`, secret-header guarded, idempotent, resumable in batches. Pulls chapters through the existing `chapter.server.ts` upstream path (bolls KJV), upserts verses, then recomputes `concordance_terms` in SQL from the tsvector lexemes. Run once after deploy; a second endpoint reports ingest progress.

**Search** — a Postgres function `concordance_search(term, filters, limit, offset)` returning ranked verses plus a facet count per book, called from `src/lib/concordance/search.functions.ts` (`createServerFn`, thin wrapper over `search.server.ts`). Results cached in memory with the existing `boundedCache`, and per-term aggregates cached client-side via TanStack Query.

**Atlas linking** — `src/lib/concordance/links.ts` maps a term to existing data with no new content authoring: `ATLAS_INDEX` entries, `GAZETTEER_PHRASES`, `PLACES`/`journeys.ts`, thread nodes in `threads/data.ts`, and `timeline/events.ts`. Related terms come from co-occurrence in `concordance_terms` plus thread-node neighbours.

**Routes** — `src/routes/concordance.tsx` (layout), `concordance.index.tsx`, `concordance.$term.tsx`. Loaders use `ensureQueryData`; components use `useSuspenseQuery`. Filters live in validated search params (`testament`, `book`, `page`) using `fallback()`, so filtered views are shareable too.

**Mobile** — single-column results, sticky compact search header, filters in a bottom sheet, tap-anywhere verse cards, and a persistent "Back to reader" affordance.

**SEO** — unique title/description and canonical per term page, `DefinedTerm`/`ItemList` JSON-LD, internal links to the matching book, map and timeline pages. Popular terms added to `sitemap.xml`; `/concordance` linked from the reader settings menu and the maps/timeline hubs.

**Analytics** — extend `NavEvent` in `src/lib/analytics/nav-events.ts` with `concordance_opened`, `concordance_search`, `concordance_result_clicked`, `concordance_filter_used`, `concordance_map_opened`, `concordance_profile_opened` (no AI event, since there is no AI path).

**Safety** — all work is additive: new routes, new lib folder, new tables. No existing reader, atlas, maps, timeline or push code changes except the two additive edits (nav event union, settings menu link). Vitest coverage for term normalisation, per-book aggregation, filter/search-param handling and Atlas link resolution.

## Rollout

1. Migration + ingest endpoint, run ingest, verify counts (e.g. "covenant" in KJV ≈ 292).
2. Search function and server functions.
3. Term page, then landing page and suggestions.
4. Atlas rails, SEO, analytics, mobile polish.
