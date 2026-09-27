# Offline support for the whole KJV Bible

Today only the chapters you open — or a single book you save by hand from the settings menu — are kept on the device. This adds a proper "download the whole KJV" experience: a friendly prompt after real usage, a managed download with progress and pause/resume, offline search, and full storage controls. Nothing existing is removed; the current per-book save stays.

## What users get

**The prompt**
- Appears only after meaningful use: 3+ chapters read, OR 10+ minutes reading, OR the app opened on 2 different days. Never on the first session.
- Card: "Read Offline. Save Data." with benefits (read without internet, faster, saves mobile data) and the real download size (~5 MB of KJV text, shown from the actual measured payload rather than a guess).
- "Download KJV" starts it; "Maybe Later" hides it for 7 days. Once downloaded, it never shows again.

**The download**
- Progress bar with chapters completed, MB transferred and estimated time left.
- Pause and Resume; if the app is closed mid-way, it resumes from where it stopped.
- Failure of individual chunks is retried; the rest still completes.
- Verified at the end (expected book/chapter/verse counts) before it's marked complete.

**Offline reading**
- Every KJV book, chapter and verse readable with no connection.
- Search works offline against the on-device text (falls back to the local index automatically when there's no network).
- Book/chapter/verse navigation, highlights, bookmarks and previously opened context panels keep working.
- An "Offline Mode — KJV" badge appears in the reader when the device is offline.

**Settings → Offline Bible**
- New section: download KJV (with size), live progress, storage used, delete KJV, re-download, and an "Auto-download over Wi-Fi only" toggle (honoured where the browser exposes connection type).

## Technical notes

- **Bulk source.** The full KJV already lives in the backend `bible_verses` table, so the download does not hammer the external Bible API. Add a server function `getKjvBundle({ fromBook, limit })` in `src/lib/offline/bundle.functions.ts` (handler in `bundle.server.ts`) returning whole books as compact chapter records, fetched a few books at a time.
- **Storage.** Extend `src/lib/offline/chapter-store.ts` (IndexedDB `bible-atlas-offline`) with a `meta` object store (`kjv-download` state: phase, completed books, bytes, verified flag, timestamp) and a `verses` search store keyed by book:chapter holding the plain text used for local search. Bump `DB_VERSION` to 2 with an upgrade path that keeps existing chapters.
- **Download manager.** New `src/lib/offline/kjv-download.ts`: a small store (subscribe/getSnapshot) driving start/pause/resume/cancel/delete, writing chapters through the existing `writeStoredChapter`, tracking bytes, and persisting resume state after each book so a reload continues.
- **Prompt eligibility.** New `src/lib/offline/usage-tracker.ts` records chapters read, reading minutes and distinct days in localStorage (`bible-atlas:usage`); `src/components/reader/OfflineKjvPrompt.tsx` renders the card (styled like the existing `InstallPrompt` bottom sheet) and is mounted once in `src/routes/__root.tsx`. Dismissal key `bible-atlas:kjv-prompt-dismissed` with a 7-day expiry.
- **Offline search.** `src/lib/offline/local-search.ts` scans the stored verse text (chunked, case-insensitive, phrase + all-words match) and returns the same `SearchHit` shape the online search returns; `SearchBar` uses it when `navigator.onLine === false` or the server search fails.
- **Offline indicator.** Small badge in `ReaderChrome`/`ReaderHeader` driven by the existing `useOnline()` + offline context.
- **Settings UI.** Extend `OfflineSection` in `src/components/reader/chrome/ReaderHeader.tsx` with the Offline Bible block (download/progress/pause/storage/delete/Wi-Fi toggle), keeping the current per-book control below it.
- **Analytics.** Emit `offline_kjv_prompt_shown`, `offline_kjv_prompt_dismissed`, `kjv_download_started`, `kjv_download_completed`, `kjv_download_failed`, `kjv_deleted`, `offline_mode_used` through the existing analytics helper.
- No database migration, no changes to online behaviour, existing service worker untouched.

## Verification

Download from a clean profile, kill the tab mid-download and confirm it resumes; then go offline and confirm any chapter opens, search returns results, and the Offline Mode badge shows. Delete from settings and confirm storage drops and the prompt logic respects the downloaded/dismissed state.
