# Bible Atlas v2.1 — Direct Verse Selection

Add a three-step Book → Chapter → Verse picker so readers land on an exact verse without scrolling, give every verse a permanent `/book/chapter/verse` URL, and announce the feature once to existing readers. Nothing existing is removed: the current sidebar, chapter URLs, `?v=` share links, maps, threads, AI panels, highlights, offline and push all keep working.

## The selector

A single "Go to verse" entry point, opened from the reader header (next to search) and from the top of the book sidebar, plus keyboard shortcut `g`.

- Step 1 — Book: searchable list, grouped by canon section, same names/aliases the sidebar already uses.
- Step 2 — Chapter: scrollable number grid, offline-availability markers as today.
- Step 3 — Verse: appears and is focused immediately after a chapter is picked; shows only the verses that actually exist in that chapter.
- Breadcrumb header (`John › 4 › verse`) with back navigation; current selection is visibly marked.
- Desktop: a centered dialog with the three columns/steps. Mobile: a bottom sheet sized for one-handed use, large tap targets, sticky breadcrumb.
- Full keyboard support (arrow keys, Enter, Escape), ARIA labels and roles, visible focus rings, semantic tokens for contrast, and `prefers-reduced-motion` respected.

Choosing a verse navigates to `/john/4/4`, opens the chapter and highlights verse 4 exactly as a shared link does today.

## Verse counts come from real data

Verse numbers are derived from the existing chapter loader (`chapterQuery`), which already serves from memory cache, the offline store, or the API. Opening the selector loads nothing extra; a chapter's verse list is fetched only when that chapter is picked, and instantly when it is already cached. Invalid verse numbers can never appear. While a verse list loads, a small skeleton shows and the step stays keyboard-usable.

## URLs, sharing, regressions

- New route `/$book/$chapter/$verse` renders the same reader with the verse highlighted, canonical + OG/Twitter metadata for that verse (reusing the existing share-meta and verse-card helpers), and an out-of-range verse falls back to the chapter.
- Existing `/book/chapter` and `/book/chapter?v=N&t=&s=share` URLs are untouched and keep working.
- Share of a verse now produces the cleaner `/book/chapter/verse` link (still carrying translation and share markers), and recipients land on the exact highlighted verse with all context features intact.
- Sitemap and chapter-level metadata unchanged.

## What's New announcement

A new release entry `2.1.0` in the existing release-notes system, so the existing banner, badge and `/whats-new` page pick it up automatically for readers who haven't seen it. In addition, a one-time lightweight modal for returning readers describing direct verse selection, with a "Try it" button that opens the selector and a "Maybe later" close. Dismissal is stored per release, so it never reappears; it never blocks reading and is suppressed for brand-new devices.

## Analytics

Extends the existing anonymous `whats_new_events` pattern with a new `nav_events` table (no personal data, random device id only): `bible_selector_opened`, `book_selected`, `chapter_selected`, `verse_selector_opened`, `verse_selected`, `verse_navigation_completed`, plus `whats_new_shown`, `whats_new_dismissed`, `whats_new_cta_clicked`. Metadata: book, chapter, verse, device type (mobile/desktop), new vs returning reader.

## Technical notes

- New route file `src/routes/$book.$chapter.$verse.tsx` delegating to `ChapterReader` with `highlightVerse`; shared head/meta logic factored out of `$book.$chapter.tsx` into a helper so both routes stay consistent.
- New components under `src/components/reader/selector/`: `VerseSelector.tsx` (state machine + shared step logic), `BookStep`, `ChapterStep`, `VerseStep`, rendered in a shadcn `Dialog` on desktop and `Sheet`/`Drawer` on mobile via the existing `useIsMobile` hook. Book/chapter data reuses `@/lib/bible`; verse numbers via `queryClient.ensureQueryData(chapterQuery(...))`.
- Trigger button added to `src/components/reader/chrome/ReaderHeader.tsx` and the sidebar header; no other chrome changes.
- New `src/lib/analytics/nav-events.ts` mirroring `share-events.ts` (fire-and-forget, shared `bible-atlas:device-id`).
- Migration: `public.nav_events` (`event`, `book`, `chapter`, `verse`, `device_type`, `reader_type`, `device_id`, `created_at`) with insert-only access for anonymous readers, no public read, admin reads server-side — matching the existing `share_events` posture.
- `RELEASES` gains `2.1.0`; app version constant bumped to `2.1.0` in config.
- Tests: unit coverage for verse-list derivation and URL building, plus a component test that the selector renders verse numbers from cache with no extra fetch.
