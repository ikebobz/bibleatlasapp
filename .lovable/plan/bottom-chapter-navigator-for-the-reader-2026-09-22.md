# Bottom chapter navigator for the reader

Today the only way to move chapters is the small "‹ Genesis 1 / Genesis 3 ›" links at the very end of each chapter, the arrow keys, or the book list behind the header. This adds a slim, always-reachable navigator at the bottom of the reading area, sitting just above the audio player bar, so readers can move quickly without losing their place.

## What the reader gets

```text
 ┌──────────────────────────────────────────┐
 │  ‹        John 4  ⌄           ›          │   ~52px, sits above the audio bar
 └──────────────────────────────────────────┘
 [ audio player bar — unchanged ]
```

- **Previous / next** (44px chevrons). They cross book boundaries (John 21 → Acts 1, Acts 1 → John 21). On Genesis 1 the left button is shown disabled, and the same goes for the right button on Revelation 22. One-chapter books (Obadiah, Jude, etc.) step to the neighbouring books.
- **Centre "John 4"** carries the most visual weight (scripture serif, medium weight). Tapping it opens the book/chapter selector.
- **Swipe** left for the next chapter, right for the previous one. A swipe only counts when it is clearly horizontal (more than 60px sideways and well over the vertical movement) and does not start on selected text, a highlighted word, or an open panel. Normal vertical scrolling is never captured.
- The bar fades back a little while you scroll down and returns fully when you scroll up or stop. It never hides completely, and the reading area gets matching bottom space so the last verse is never covered.

## Book and chapter selector (bottom sheet)

- On phones it opens as a bottom sheet. On tablets and desktops it opens as a centred sheet of the same design, and the existing sidebar stays.
- A header reads "Bible", with an Old Testament | New Testament toggle that opens on the current book's testament.
- The book list has the current book marked. Tapping a book shows its chapter grid right away: 5–8 columns depending on width, and books with 150 chapters scroll inside the sheet. The current chapter is filled in, and chapters saved for offline show the existing offline marker.
- Tapping a chapter goes to it and closes the sheet. Closing by swiping down, tapping outside, pressing Escape or using the close button leaves your reading position untouched.
- It includes keyboard focus trapping, focus return and screen-reader labels, following the existing dialog pattern.

## When you change chapters

- The address updates through normal in-app navigation, so browser back and forward work and the page doesn't reload.
- Your translation, font size, line spacing and quiet mode are kept, because they come from the existing settings.
- The new chapter opens scrolled to the top. Links to a specific verse still jump to that verse.
- A quick 150ms slide in the direction of travel plays, and it is turned off when the device asks for reduced motion.
- The next and previous chapters are loaded ahead of time in your current translation, so moving between chapters feels instant. Saved offline chapters load from the device. Slow or missing chapters use the existing loading and "chapter unavailable" screens.

## Left unchanged

The header, sidebar, audio player, the book list, the arrow-key shortcuts, share links, `?v=`/`?t=`/`?lang=` links, highlights, maps and offline storage. The chapter-end "‹ Previous / Next ›" links are kept as a secondary way to move.

## Technical details

- New `src/components/reader/chrome/ChapterNavBar.tsx`: `position: sticky` / fixed at `bottom: calc(var(--audio-bar-h,0px) + env(safe-area-inset-bottom))`, `bg-background/90 backdrop-blur border-t`, semantic tokens only. It publishes its height as `--chapter-nav-h`. `ChapterReader`'s bottom padding and scroll padding add `--chapter-nav-h`. Floating prompts (UpdatePrompt, InstallPrompt, OfflineKjvPrompt, FirstRunTip, WrongOriginNotice) add it to their offset.
- It uses `stepChapter()` from `src/lib/bible.ts` and `<Link to="/$book/$chapter">`, with `preload="intent"` and a `queryClient.prefetchQuery(chapterQuery(...))` call for next and previous in the active translation.
- New `ChapterSheet.tsx`, built on the existing shadcn Dialog/Drawer primitive with bottom-sheet classes, which reuses `BOOKS`/testament data from `bible.ts` and the offline markers from `OfflineContext`. `BookNavContext.open()` on mobile can open this sheet.
- New `useChapterSwipe(ref, { onNext, onPrev })`: pointer or touch events with `touch-action: pan-y` on the verses container. It uses direction locking, ignores events from inputs, selections, `[data-entity]` words and dialogs, and is disabled while the Atlas panel is open.
- Scroll-to-top on a `book/chapter` change when there is no verse target, placed in `ChapterBody`'s effect next to `rememberPosition`. The slide animation uses a CSS class keyed on navigation direction, with `motion-reduce:` disabling it.
- Tests: unit tests for swipe classification (horizontal vs vertical) and for book-boundary stepping (Genesis 1, Revelation 22, Obadiah, Malachi→Matthew). Playwright checks at 320, 390, 430, landscape, 820 and 1280px, with 200% font scale, confirming the bar never covers the last verse, the sheet opens and navigates, swipe works, and back/forward work.
- Bump the version and add a release note.