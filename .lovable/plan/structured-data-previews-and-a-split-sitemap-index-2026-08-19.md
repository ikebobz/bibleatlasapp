# Structured data, previews, and a split sitemap index

Two goals: make the home and verse pages fully self-describing to search engines
and AI bots, and split the sitemap so crawlers can reliably discover all of
Scripture.

## 1. Home page metadata

Today the homepage inherits title, description and social tags from the root and
only adds its own canonical and og:url. It has no page-level structured data.

- Give `/` its own title, description, og:title/og:description and twitter tags
  so the homepage reads as the reader entry point rather than a generic site
  default (root defaults stay as the fallback for other routes).
- Add homepage JSON-LD: a `WebPage` tied to the existing `WebSite` graph, a
  `SearchAction` pointing at the concordance search so Google can offer a
  sitewide search box, and a `BreadcrumbList` root node.
- Keep the single self-referencing canonical and og:url.

## 2. Verse and chapter metadata validation

Verse pages already emit verse-led titles, branded OG/Twitter cards and a
book → chapter → verse JSON-LD graph. This step audits and tightens it:

- Confirm exactly one canonical per rendered page (the chapter route already
  yields to the verse leaf) and that canonical, og:url and the JSON-LD `url`
  all self-reference the same URL.
- Add missing bits to the verse graph: `datePublished`-free but with
  `isAccessibleForFree: true`, `inLanguage`, `publisher` linked to the existing
  Organization node, and `citation`/`text` for the verse itself.
- Ensure `twitter:card`, image dimensions and alt text are present on both the
  chapter and verse routes (they are today; the tests will lock it in).
- Extend `src/lib/structured-data.test.ts` and `src/lib/reader-head.test.ts`
  with assertions for the new fields, single-canonical behaviour, and that
  every emitted URL uses `https://mybibleatlas.com`.

## 3. Sitemap index + child sitemaps

Replace the single `/sitemap.xml` document with a sitemap **index** that points
at focused child sitemaps. The existing server-route mechanism stays; only the
output is split.

```text
/sitemap.xml                  sitemap index
  /sitemaps/pages.xml         home, about, maps, timeline, connections,
                              concordance, whats-new, journeys, thread nodes,
                              concordance terms
  /sitemaps/books.xml         66 book landing pages
  /sitemaps/chapters-1.xml    chapters, split into chunks well under the
  /sitemaps/chapters-2.xml    50,000-URL / 50 MB limit
  ...
  /sitemaps/verses.xml        curated popular verses only
```

- Chapters (~1,189 URLs) are chunked so the structure scales if per-verse
  coverage is widened later.
- Verses: a curated list of well-known references (John 3:16, Psalm 23:1,
  Romans 8:28, Philippians 4:13, Jeremiah 29:11, Genesis 1:1, and similar),
  defined in one place in code so it is easy to extend. The ~31,000 remaining
  verse URLs stay out of the sitemap and remain crawlable through chapter pages.
- No `<lastmod>` values, since there is no authoritative per-page change
  timestamp.
- Excluded as before: `/admin/*`, `/api/*`, `/highlights`, 404 and wildcard
  routes.
- `public/robots.txt` keeps its single `Sitemap:` directive pointing at the
  index; the index handles discovery of the children.

## Technical notes

- New: `src/routes/sitemaps.$section[.]xml.ts` (server route serving each child
  sitemap) and a shared `src/lib/sitemap.ts` holding entry builders, the chunk
  size constant, and the curated popular-verse list.
- `src/routes/sitemap[.]xml.ts` becomes the index generator using that shared
  module.
- Home metadata lives in `src/routes/index.tsx` `head()`; new JSON-LD builders
  go in `src/lib/structured-data.ts` next to the existing book/chapter/verse
  builders.
- Verification after implementation: run the test suite, fetch
  `/sitemap.xml` and each child sitemap locally to confirm well-formed XML and
  correct URL counts, and check the rendered HTML of `/`, a chapter and a verse
  page for exactly one canonical, correct og/twitter tags, and valid JSON-LD.
