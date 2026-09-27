# Make a downloaded Bible genuinely readable offline

## What I found (root causes, from reading the code)

**1. Opening or refreshing a chapter page while offline has no fallback page.**
The service worker config (`vite.config.ts`) handles every page load with a
"try the network first" rule that caches pages you have already visited. There
is no offline fallback wired into that rule, so a chapter page you have never
opened before — or a shared link tapped from outside the app, or a refresh in
the installed app — has nothing to fall back on and fails, even though the
chapter text is sitting in on-device storage. Chapters you happened to visit
while online still open, which is exactly the "works for some, fails for
others" behaviour reported.

**2. The page loader and the reader disagree about which version to load.**
`src/routes/$book.$chapter.tsx` (and the verse route) loads the chapter for the
version in the link's `t` parameter, falling back to KJV — it never looks at
the version the reader actually has selected in settings. The reader component
then loads the selected version separately. Offline, if you read in WEB, Yoruba
or Igbo, the loader looks for a version you may not have downloaded and shows
"This chapter isn't saved yet" before the reader ever gets a chance.

**3. Downloaded chapters are the last resort, not the first.**
`src/lib/chapter-query.ts` only reads from the device when the browser reports
itself offline, or after a network attempt has already failed. On a weak or
captive connection (common on phones) the browser still reports "online", so a
chapter you already own waits on a doomed request, and every navigation spends
an API request on content already on the device.

**4. The error page tells the wrong story.** Any loader failure renders
"This chapter isn't saved yet", including plain network failures for versions
that *are* saved.

## What will change

**One place decides where Bible text comes from.** A single data layer
(`src/lib/chapter-query.ts`) becomes the only route to chapter text: on-device
store first for any downloadable version, network only when the chapter is not
stored, and every fetched chapter written back. Route loaders, the reader, the
verse-comparison panel and search all go through it. Licensed versions (NIV,
MSG and other display-only texts) are unchanged — online only, never stored.

**Loaders follow the reader's chosen version.** The chosen version moves into
the URL/route context so loader and reader always agree; a link's `t` still
wins when someone opens a shared verse.

**Offline page loads work.** The service worker gets an explicit offline
fallback for page loads so any chapter or verse URL opens the app shell when
there is no network, and the reader then serves the text from storage. Bible
content stays in IndexedDB, the worker stays responsible only for the app
shell and static assets.

**Honest offline messaging.** Three distinct states replace the single error:
version downloaded but chapter missing, version not downloaded ("Download this
version while connected to read it offline"), and a plain network error with a
retry. No offline failure will read as "no verses found".

**Storage and status.** The Offline Bible settings section lists every
downloadable version with status (Downloaded / Partial / Not downloaded), size
and delete, instead of only the currently selected one. Partial downloads are
labelled and resumable; a version is only marked Downloaded after its chapters
are verified in storage. An unobtrusive "Offline" / "Back online" indicator in
the reader header; reconnecting does not refetch anything already stored.

**Search and AI context.** Offline search already falls back to the on-device
text; it will also prefer local results whenever the current version is fully
downloaded, saving API requests. AI explanations already cached on the device
stay viewable offline; uncached ones show "needs a connection" and stop
retrying while offline.

## Technical notes

- `chapter-query.ts`: `loadChapterOffline` becomes store-first for
  non-licensed versions, with a typed `ChapterUnavailableError`
  (`reason: "not-downloaded" | "network"`).
- `$book.$chapter.tsx` / `$book.$chapter.$verse.tsx`: resolve the version from
  link `t` → persisted settings (read in the router context) → `kjv`;
  error components branch on the error reason. Verse-comparison loads stay
  best-effort and never block.
- `vite.config.ts` Workbox: give the navigation rule a precached offline
  fallback (`/` shell) so unvisited chapter URLs resolve offline; asset and
  font rules untouched; `/api/`, `/_serverFn/`, `/~oauth` stay excluded.
- `chapter-store.ts`: add `countStoredChapters(translation)` and
  `storedBytes(translation)` for the storage list; keys stay
  `{translation}:{book}:{chapter}` with the existing legacy-key handling.
- `kjv-download.ts`: verify stored chapter counts before marking `complete`;
  expose a per-version summary for settings.
- `OfflineBibleSection.tsx`: multi-version list with per-version progress,
  delete and re-download.
- Tests (`vitest`): store-first resolution, licensed-version bypass, loader
  version resolution, chapter-to-chapter navigation offline with a seeded
  fake IndexedDB, verse-route offline, partial-download reporting, and local
  search preference. Existing online behaviour covered by current tests must
  keep passing.

## Verification

Download KJV, close and reopen, go offline, then: Genesis 1 → 2 → 10 → Exodus 1
→ John 3 → John 3:16, refresh mid-chapter, open a shared verse link cold, and
search — all from storage with no network requests. Repeat with a second
downloaded version to confirm the two datasets stay separate, then delete one
and confirm the other is unaffected.
