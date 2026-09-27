# Fix one-chapter books showing only verse 1

## Root cause (confirmed)
The main Bible text source reads a request like "Philemon 1" as "Philemon, verse 1" for books with a single chapter. So Philemon, Obadiah, 2 John, 3 John and Jude came back with only their first verse. I tested this directly against the source: each of the five books returned 1 verse. Asking for "Philemon 1:1-25" returns all 25. Books with more than one chapter are not affected.

Partial copies may also have been saved to the backup store and to phones for offline reading, so the fix has to clear those as well.

## Changes
1. When loading a one-chapter book, ask the source for the full verse range (for example `philemon+1:1-25`), using the app's existing verse-count table.
2. Completeness check: if any source returns fewer verses than the verse-count table expects, treat that as a failure. The app then tries the next source instead of showing or saving a partial chapter. This covers every book and every translation. A small tolerance allows for translations that number verses differently.
3. Backup store: skip saved copies that have fewer verses than expected, and delete the partial copies already saved for the five books.
4. Offline copies on devices: a saved chapter with too few verses counts as missing, so it gets downloaded again the next time the reader is online.
5. Tests: the five one-chapter books ask for the full range, and a short reply is rejected.

## Verification
- Load all 66 books and all 1,189 chapters in KJV and compare the verse counts with the table.
- Spot-check Philemon, Jude and Obadiah in the other translations.
- Open /philemon/1 in the browser: all 25 verses show.

## Technical details
- `src/lib/chapter.server.ts`: `fromBibleApi` adds `:1-N` when `book.chapters === 1`. The attempt loop compares the result with `versesInChapter()` (reject if under about 90%).
- `chapter-fallback.server.ts`: the same check in `readCachedChapter` and before `writeCachedChapter`. A one-time delete from `chapter_cache` for the 5 book ids.
- `src/lib/offline/chapter-store.ts`: the same check when reading a stored chapter.
