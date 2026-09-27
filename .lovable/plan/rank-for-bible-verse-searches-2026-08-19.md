# Rank for Bible verse searches

## Where the app stands today (checked)

Good news — the foundations are already there:

- `/john/3/16` is server-rendered: the full chapter text is in the HTML, so Google sees real Scripture, not an empty shell.
- The verse page already has a verse-led title (`John 3:16 — Bible Atlas`), a description quoting the verse, a self-referencing canonical, OG/Twitter cards and book → chapter → verse JSON-LD.
- `/sitemap.xml` is a sitemap index covering hub pages, 66 books and all 1,189 chapters.

Three gaps stop verse queries from landing on the app:

1. **Verse pages look identical to their chapter page.** The visible content is the same — same `H1` ("John 3"), same body text. Only the meta tags differ. Google usually folds pages like that into one and keeps the chapter, so "John 3:16" queries have no dedicated page to rank.
2. **Only 41 verse URLs are discoverable.** The curated popular-verse sitemap has 41 entries; the remaining ~31,000 verses have no sitemap entry.
3. **Weak internal linking to verses.** Whether each verse number in the chapter links to its own verse URL needs an audit; without that, crawlers have no path into verse pages.

## What to change

### 1. Make a verse page genuinely about that verse

When the URL contains a verse, the reader renders a verse-first layout above the chapter:

- `H1` becomes the reference itself (`John 3:16`), with the verse text quoted directly beneath it in the active translation.
- A short context line ("Verse 16 of 36 in John chapter 3 — King James Version").
- Previous verse / next verse links and a "Read the whole chapter" link.
- The full chapter stays below under an `H2` ("John 3 — full chapter"), with the verse still highlighted and scrolled into view exactly as today.

Chapter URLs are untouched, so no existing behaviour changes.

### 2. Unique supporting content per verse

Below the quoted verse, add compact blocks that make each verse page distinct:

- The same verse in the other loaded public-domain translations (WEB / ASV alongside KJV).
- Existing thematic connections and map/journey links that already apply to that chapter, filtered to the verse where the data allows.
- A visible breadcrumb (Bible Atlas → John → John 3 → 3:16) matching the breadcrumb JSON-LD already emitted.

### 3. Full verse discovery

- Link every verse number in the chapter to its own verse URL (audit first; add if missing).
- Expand the sitemap from 41 verse URLs to every verse, served as chunked child sitemaps (`/sitemaps/verses-1.xml` …, ~500 URLs each) from the existing sitemap index. Curated popular verses keep the higher priority value.
- Keep `/admin`, `/api`, `/highlights` excluded as today.

### 4. Confirm with Google

After publishing: resubmit `/sitemap.xml` in Search Console and inspect a few verse URLs (John 3:16, Psalm 23:1, Philippians 4:13) to confirm they are crawlable and indexable as distinct pages. Indexing at this scale is gradual — expect weeks, not days, and the curated popular verses will be picked up first.

## Technical notes

- Verse-first layout: extend `ChapterReader` with an optional verse-lead header driven by the existing `highlightVerse` prop; the `/$book/$chapter/$verse` loader already returns `verseText`.
- Heading structure stays valid: one `H1` per page (reference on verse routes, chapter on chapter routes), chapter text demoted to `H2`.
- `src/lib/reader-head.ts` metadata is already correct; only add the verse's `text` to the JSON-LD where missing.
- Sitemap changes live in `src/lib/sitemap.ts` (`verseEntries`, chunking, `sitemapSections`, `entriesForSection`); the index and `/sitemaps/$section` routes need no structural change.
- Extend `src/lib/sitemap.test.ts` and `src/lib/reader-head.test.ts` for chunk counts, total verse URL count, and single-canonical behaviour.
- Verification: run the test suite, fetch `/sitemap.xml` plus a verse chunk, and check the rendered HTML of `/john/3/16` for one `H1` with the reference and the verse text above the fold.
