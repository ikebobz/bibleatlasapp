# Structured data, book pages, and crawler discovery

Give every level of Scripture — book, chapter, verse — its own indexable page and
machine-readable structured data, then make sure crawlers can find them all.

## 1. Book landing pages

New route `/{book}` (e.g. `/genesis`, `/john`) that today returns 404.

Each page shows:
- Book name, testament and section (Law, Prophets, Gospels…), chapter count
- A short descriptive intro line for search results
- A grid of links to every chapter in the book
- Previous/next book navigation

Metadata per book: unique title (`Genesis — read all 50 chapters | Bible Atlas`,
kept under 60 characters), unique description, og/twitter tags, self-referencing
canonical and og:url.

## 2. Structured data (JSON-LD)

A single shared builder so the three levels form one consistent hierarchy.

- **Book page**: `Book` (with `numberOfPages`-style chapter count and
  `hasPart` pointing at chapters), plus `BreadcrumbList` (Home → Book).
- **Chapter page**: `Chapter`, `isPartOf` the Book, `position` = chapter number,
  plus `BreadcrumbList` (Home → Book → Chapter). Keeps the existing Article-style
  fields that power previews.
- **Verse page**: `Chapter` context plus the quoted verse text, `isPartOf` the
  chapter, plus `BreadcrumbList` (Home → Book → Chapter → Verse).

All entities carry stable `@id` URLs so Google can link them, and everything is
tied back to the existing sitewide `WebSite`/`Organization` graph in the root route.

## 3. Sitemap

Extend the existing generated sitemap at `/sitemap.xml`:

- `/` (priority 1.0)
- `/connections` and each connection node (unchanged)
- **new**: one entry per book (66 URLs, priority 0.8)
- one entry per chapter (~1,189 URLs, priority 0.7)
- `/whats-new`

Excluded on purpose: `/highlights` (personal, device-local), `/admin/devices`,
API routes, and individual verse URLs — verses stay crawlable through chapter
pages, and listing ~31,000 thin URLs would dilute crawl budget.

No `<lastmod>` values, since there's no per-page authoritative change timestamp.

## 4. robots.txt

Keep the existing per-crawler allow blocks and the `Sitemap:` directive. Add
explicit `Disallow` rules for `/admin/`, `/api/`, and `/highlights` so crawlers
skip private and non-content routes.

## Technical notes

- New files: `src/routes/$book.index.tsx` (book landing) and a shared
  `src/lib/structured-data.ts` used by book, chapter and verse heads.
- `src/routes/$book.$chapter.tsx` becomes a parent for both the chapter leaf and
  the verse route; the book route is a separate sibling, so existing chapter and
  verse URLs are unaffected.
- `src/lib/reader-head.ts` keeps owning titles/descriptions/preview cards; only
  its `scripts` section moves to the shared builder.
- Sitemap changes stay inside `src/routes/sitemap[.]xml.ts` (server route, already
  in use — no mechanism change).
- Existing tests in `src/lib/reader-head.test.ts` get updated for the new JSON-LD
  shape, with new assertions for the book-level graph.
