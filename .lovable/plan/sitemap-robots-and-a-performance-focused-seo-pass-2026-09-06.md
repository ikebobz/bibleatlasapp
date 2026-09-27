# Sitemap, robots, and a performance-focused SEO pass

## What's already true

Checked live on mybibleatlas.com: `/sitemap.xml` and `/robots.txt` both return
successfully, the sitemap index lists its child files (pages, people, places,
books, chapter chunks, verse chunks), and each child file returns valid XML.
So this work is validation and tuning, not building from scratch.

## 1. Validate the sitemap and robots

- Walk every entry in the sitemap index on the live site and confirm each child
  file loads, is well-formed XML, and stays under the size/URL limits.
- Spot-check a sample of URLs from each section (a book, a chapter, a verse, a
  person, a place, a concordance term, a journey) and confirm each returns a real
  page, not a redirect or a missing page.
- Confirm private areas (admin, highlights, internal endpoints) appear nowhere in
  the sitemap and stay blocked in robots.
- Confirm every listed address uses mybibleatlas.com, with no leftover old
  addresses.
- Fix any broken, redirecting, or wrongly included entries found.

## 2. Lighthouse SEO and accessibility check

- Run Lighthouse against the live site for the home page, a chapter page, a verse
  page, and the About page.
- Report each score plus every remaining failing item, with a short explanation of
  what it means.
- Fix the failing items that are safe and in scope (labels, contrast, heading
  order, link text, page descriptions). Anything that needs a product decision is
  listed for approval rather than changed silently.

## 3. Performance pass

- Measure Core Web Vitals (loading, responsiveness, layout shift) on the same
  pages from the Lighthouse runs.
- Images: check the preview/social pictures and in-app artwork for oversized
  files, missing width/height, missing lazy loading, and modern formats where
  it helps.
- Caching: review the caching instructions the site sends for pages, static
  files, sitemap files, and the preview-image endpoint. Long-lived caching for
  fingerprinted assets, short caching for pages and sitemaps.
- Startup weight: check what loads before the first verse appears and defer
  anything not needed for the initial read.
- Re-measure after each change so improvements are evidenced, not assumed.

## Technical notes

- Sitemap logic lives in `src/lib/sitemap.ts` with the index at
  `src/routes/sitemap[.]xml.ts` and children at `src/routes/sitemaps.$section.ts`;
  the existing mechanism stays, entries only get corrected.
- `public/robots.txt` is edited in place; its `Sitemap:` directive already points
  at the canonical domain.
- Lighthouse runs headless via the sandbox browser against the published URL;
  results are reported in chat.
- Caching headers come from the server route handlers and the static asset config;
  no change to the hosting setup itself.
- No new pages, no database changes, no redesign.

## Out of scope

- Submitting the sitemap in Search Console (needs your account).
- Publishing — I'll tell you when the changes are ready to go live.
