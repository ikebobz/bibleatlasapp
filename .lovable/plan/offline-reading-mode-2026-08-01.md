# Offline reading mode

Keep reading Bible Atlas — Scripture text plus already-seen context panels — when the network drops.

## What you'll get

- **Installable app shell.** The app itself (code, fonts, styles, icons) is cached, so opening Bible Atlas with no connection loads the reader instead of a browser error page.
- **Chapter text stored on your device.** Every chapter you open is saved locally. Offline, those chapters open instantly and normally; chapters you've never opened show a clear "not downloaded yet" notice with a link back to ones you have.
- **Context panels keep working offline.** Tapped-word context, artifact purpose notes, and lexicon entries already persist in browser storage. Offline, those saved panels open exactly as before; anything not yet generated shows a short "needs a connection" message instead of a spinner that never resolves.
- **Offline indicator.** A small banner in the reader header shows when you're offline and how many chapters are available on this device.
- **Download for offline.** In the type/settings menu, a "Save this book for offline" action fetches and stores the current book's chapters with a progress count, so you can prepare before a flight or a commute.
- **Recently read stays reachable.** The book navigation marks which books/chapters are downloaded while offline.

Search, and generating brand-new AI context, still require a connection — those will say so plainly rather than fail silently.

## Technical approach

**Service worker (offline shell)**
- Add `vite-plugin-pwa` in `generateSW` mode with `registerType: "autoUpdate"`, `injectRegister: null`, `devOptions.enabled: false`, SW filename `/sw.js`.
- Single guarded registration wrapper (`src/lib/pwa/register-sw.ts`) called from `src/routes/__root.tsx`. It refuses to register — and unregisters any existing `/sw.js` — when not `PROD`, inside an iframe, on `*.lovableproject.com` / `*.lovableproject-dev.com` / `preview--*` / `id-preview--*` / `*.beta.lovable.dev` hosts, or when the URL has `?sw=off`.
- Navigation requests use `NetworkFirst`; hashed same-origin build assets use `CacheFirst`. `/~oauth` excluded from navigation fallback.
- Add `public/manifest.webmanifest` (name, short name, standalone, theme/background colors matching the parchment theme) plus icons, and the matching head links in `__root.tsx`.

**Chapter persistence**
- New `src/lib/offline/chapter-store.ts`: IndexedDB-backed store (`bible-atlas-offline` / `chapters`), keyed `book:chapter`, holding the same payload `getChapter` returns. IndexedDB rather than localStorage because full-book downloads exceed the 5 MB quota.
- `chapterQuery` in `src/lib/chapter-query.ts` gains an offline-aware `queryFn`: on success write through to the store; on failure (or when `navigator.onLine` is false) read from the store and return it, otherwise rethrow.
- Because the reader uses `useSuspenseQuery`, the route's error boundary gets an offline-specific fallback in `src/routes/$book.$chapter.tsx` listing downloaded chapters.

**Offline state + UI**
- `src/lib/offline/useOnline.ts`: `online`/`offline` event hook, hydration-safe (assumes online until mounted).
- `ReaderChrome.tsx`: offline banner, downloaded-chapter markers in `BookNav`, and a "Save this book for offline" action that iterates the book's chapters through the server function with a progress counter and concurrency of 3.
- `AtlasPanel.tsx` (`AiPanelBody`, `PurposeBlock`) and `LexiconCard`: when offline and no cached value exists, render an "available when you're back online" message instead of the loading state; `retry: false` while offline. Existing `localStorage` caches (`atlas.context.v1`, `atlas.purpose.v1`, `atlas.lexicon.v1`) are unchanged and already serve as the offline source.
- `SearchBar.tsx`: disabled with an explanatory note while offline.

Offline behavior only works on the published site — the Lovable editor preview intentionally never registers a service worker.
