# Bible version switcher (WEB / KJV)

Let readers pick between the World English Bible and the King James Version. Both are public domain and both are already served by bible-api.com, so no licensing or new provider is needed.

## What the reader sees

- A small version control in the reader header (next to the existing settings), showing "WEB" or "KJV" with a dropdown to switch.
- Switching re-renders the current chapter in the chosen version immediately; the choice sticks across chapters, sessions and devices via the existing settings storage.
- The footer/aria label under the text updates from "World English Bible" to the active version name.
- Search results come from the active version, and the search panel labels which version it searched.
- Offline: chapters are stored per version, so a chapter saved in WEB stays readable offline in WEB. Switching to KJV offline shows the existing "not saved for offline" message unless that version was also saved. "Save for offline" saves the version currently selected.

## Technical changes

Translation model
- Add `src/lib/translations.ts`: `TranslationId = "web" | "kjv"` plus display name, short label, and the api/search codes for each.
- Add `translation` to `ReaderSettings` in `src/components/reader/settings.tsx` (default `"web"`), persisted with the existing localStorage settings blob.

Fetching and caching (version becomes part of every key)
- `src/lib/chapter.server.ts`: `loadChapter(bookId, chapter, translation)` — pass the code to bible-api.com and include it in the in-memory cache key.
- `src/lib/chapter.functions.ts`: extend the Zod input with an optional `translation`, defaulting to `web`.
- `src/lib/chapter-query.ts`: `chapterQuery(book, chapter, translation)` with the translation in the query key; `loadChapterOffline` passes it through.
- `src/lib/offline/chapter-store.ts`: `chapterKey` becomes `${translation}:${book}:${chapter}`, with existing unprefixed keys read as `web` so nothing already saved is lost. `storedChapterKeys` consumers updated accordingly.
- `src/lib/offline/download.ts`: download a book in the active version; the "saved" set is version-aware.

Search
- `src/lib/search.server.ts`: take a translation and hit the matching bolls.life index (`WEB` / `KJV`); `search.functions.ts` validates it.
- `src/components/reader/SearchBar.tsx`: send the active translation and include it in the query key.

UI
- `src/components/reader/ReaderChrome.tsx`: version dropdown wired to `useSettings().update({ translation })`, using existing UI primitives and design tokens.
- `src/components/reader/ChapterReader.tsx`: read the translation from settings, pass it to `chapterQuery`, and use the version display name in the visible caption and screen-reader label.
- `src/routes/$book.$chapter.tsx`: the loader prefetches the default (`web`) chapter for SSR/prerender; the component's `useSuspenseQuery` fetches the user's version on the client. Route metadata is unchanged so canonical URLs stay stable.

Left as-is
- Atlas context, lexicon, artifacts, highlights and connections keep working on whichever text is displayed; highlights remain keyed by book/chapter/verse, so a verse highlighted in WEB still shows in KJV.
