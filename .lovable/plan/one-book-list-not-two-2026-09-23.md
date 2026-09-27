# One book list, not two

## Summary

On phones and tablets, the top-left menu button opens a "Books" panel that does the same job as the new bottom picker — only differently. We'll remove that duplicate entry point on small screens and move the three useful things it could do into the bottom picker, so there is exactly one way to jump to any book, chapter, or verse. On a computer, the panel that stays down the left side is untouched.

## What changes

**Remove the duplicate (phones and tablets)**
- The three-line "Open books" button at the top left of the reader goes away; the left-side "Books" panel that it opened goes away too.
- The reader header on a phone starts with just the Bible Atlas link, then the usual search, explore, version and settings controls.
- The computer layout keeps its permanent left-hand book panel exactly as it is today.

**The bottom picker takes over the useful parts**
- **Find a book**: a search box at the top of the picker. It understands full names and short forms — "1 sam", "ps", "song of songs", "rev" — and shows a clear "no book matches" message when nothing does. While you're typing it searches the whole Bible, not just the current testament.
- **Section headings**: books are grouped under Law, History, Wisdom & Poetry, Prophets, Gospels & Acts, Letters and Apocalyptic, inside the Old / New Testament tabs that are already there. Tapping a book still unfolds its chapters right below it; single-chapter books still go straight in.
- **Offline clarity**: when you're not connected, chapters that aren't saved on the device are greyed out and say so ("Not saved on this device") rather than only showing a small dot when they are saved. Saved ones keep their marker and now explain themselves on hover or long-press.

**Housekeeping**
- The book-matching rules move into one shared place, so the computer panel and the phone picker can never drift apart again.
- Dead wiring around the removed panel (an unused "open the book list" helper and its scroll-to-panel behaviour) is deleted, along with its unused export.

## How it will be checked

- A phone-sized run (390px, and 320px to be safe): the top-left menu button is gone, the bottom bar opens the picker, "haba" finds Habakkuk, section headings show, and tapping a chapter lands on it.
- Offline mode: unsaved chapters are visibly greyed with the reason, and tapping one still shows the existing honest "you're offline" message.
- A computer-sized run (1280px): the left panel is present, its search and chapter/verse choosing still work.
- Type checking and the full test suite, plus new tests for the short-form book names.

## Technical details

- `src/components/reader/chrome/ReaderHeader.tsx`: drop the `lg:hidden` "Open books" trigger and the `onOpenBooks` prop.
- `src/components/reader/ReaderChrome.tsx`: remove the drawer state and render, the `BookNavContext` provider, and the `#book-navigator` scroll helper.
- Delete `ReaderSidebarDrawer` and `src/components/reader/chrome/book-nav-context.ts`; keep `BookNav` + `ReaderSidebar` for the computer layout.
- `src/lib/bible.ts`: add `matchBooks(query)` holding the current name/id/alias matching, used by both `BookNav` and the picker.
- `src/components/reader/chrome/ChapterSheet.tsx`: add the search field, `SECTION_ORDER`/`SECTION_LABEL` grouping, and the offline dimming from `useOfflineLibrary()` (`online`, `stored`).
- `src/lib/release-notes.ts`: new `2.16.0` entry at the top of the list.
