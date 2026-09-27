# Make verse selection part of the chapter selector

Right now "Go to a verse" is a separate feature: its own icon in the header, its own button in the sidebar, and its own three-step dialog that duplicates the book and chapter lists already in the sidebar. This folds verse picking into the one place readers already use to move around Scripture — the book/chapter navigator — and removes the duplicate.

## What changes for the reader

- Open the book list (sidebar on desktop, the Books drawer on mobile) and tap a book, exactly as today.
- The chapter grid appears as today. Tapping a chapter now expands a verse row underneath it, listing the verses that actually exist in that chapter, with the current chapter's verse highlighted.
- Tapping a verse navigates to `/john/4/4` and highlights it, same as today. Tapping the chapter number itself (a second tap, or the "Whole chapter" chip at the start of the verse row) opens the chapter from verse 1 — chapter navigation never gets slower or harder.
- The verse row shows a small skeleton while the chapter loads, and nothing extra is fetched until a chapter is actually tapped.
- Keyboard: arrow keys, Enter and Escape work within the book/chapter/verse lists; focus rings stay visible; reduced motion respected.

## What goes away

- The separate "Go to a verse" icon in the reader header.
- The "Go to a verse" button at the top of the desktop sidebar and mobile drawer.
- The standalone three-step dialog/sheet and the `G` shortcut that opened it.
- The "Try it now" button in the v2.1 announcement now opens the book list instead of a separate dialog; the announcement text is reworded to describe verse selection inside the chapter picker.

Everything else is untouched: permanent `/book/chapter/verse` URLs, share links and previews, `?v=` links, offline markers, highlights, maps, threads and push all keep working.

## Technical notes

- `src/components/reader/chrome/ReaderSidebar.tsx`: `ChapterGrid` gains local `expandedChapter` state; when set, it renders a `VerseRow` below the grid. Verse numbers come from `queryClient.ensureQueryData(chapterQuery(book, chapter, translation))` (memory cache / offline store / API — no extra network when cached). Verse links use `<Link to="/$book/$chapter/$verse">`. Delete `GoToVerseNavButton` and its usages.
- `src/components/reader/chrome/ReaderHeader.tsx`: delete `GoToVerseButton`, its `useVerseSelector` import and the `ListOrdered` icon import.
- `src/components/reader/selector/VerseSelector.tsx`: reduce to a small `openBookNav` context (opens the mobile drawer / focuses the sidebar) or remove entirely if nothing needs it; `VerseSelectorProvider` is dropped from `src/components/reader/ReaderChrome.tsx` accordingly, and the drawer open state it needs is lifted there.
- `src/components/reader/WhatsNewAnnouncement.tsx`: CTA opens the book navigator; copy updated.
- `src/lib/release-notes.ts`: reword the 2.1.0 entry to describe verse selection inside the chapter selector.
- `src/lib/analytics/nav-events.ts`: unchanged event names, fired from the new inline flow (`chapter_selected`, `verse_selector_opened`, `verse_selected`, `verse_navigation_completed`); `bible_selector_opened` now fires when the book navigator is opened.
- Tests: keep existing coverage; update/add a component test that the verse row renders verse numbers from cache without an extra fetch.
