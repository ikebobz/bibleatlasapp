# Make "Save Map" honest: verified offline maps with real states

## What I found in the current code (audit)

The Save Map button is the only offline-map control, and today it does this:

1. Fetches the map style once, derives one tile address pattern from it.
2. Downloads ~all tiles for the Bible-lands box at zooms 4–8, six at a time, each with a 15s timeout and 2 retries; a piece that still fails is **skipped, not reported**.
3. Stores tile bytes in browser Cache Storage (`atlas-map-tiles`) and an index of what was stored in IndexedDB (`bible-atlas-map-tiles`).
4. The button shows "saved" purely from `IndexedDB count > 0`.

Concrete problems this creates:

- **The 99% freeze / reset.** Progress is "jobs attempted ÷ total", so it counts failures as progress. When the last batch fails or the browser evicts storage, progress ends near the top, then the final read of the index returns few/zero rows and the button snaps back to "Save Map". Nothing tells the user anything failed. There is also no error state at all — every failure path silently falls back to the plain icon.
- **Saved does not mean usable.** Only vector tiles plus the style and sprite are saved. **Map fonts (glyphs) and the terrain elevation tiles are never downloaded**, so even a "complete" save can render a blank/label-less map offline.
- **Address mismatch risk.** The downloader guesses the tile address from the style; the map library builds its own (with a per-session token). The service worker ignores the query string when matching, but if the path shape differs at all, the saved bytes are never read. This has never been verified end to end.
- **Worker requests may bypass the cache.** The map fetches tiles from background workers; on iOS Safari those requests are often not routed through the service worker, so saved tiles can be unreachable exactly on the platform where offline matters most.
- **No per-area model.** There is one global blob of tiles, so "multiple saved maps with independent states" does not exist today.

So: maps *were* partly downloading, but the app could not tell a good save from a bad one, and a good save was not proven to render offline.

## The fix

### 1. Prove it before claiming it

After a save, the app runs a real verification pass: it re-reads a random sample of the required pieces out of storage, and asks the map to render the saved area with the network path disabled. Only if that succeeds is the save recorded as complete. If verification fails, the state becomes "Incomplete — try again", never "Saved".

### 2. Download everything the map actually needs

Add the missing pieces to the download: label fonts (glyph ranges actually used), terrain elevation tiles when 3D is on, sprite variants, and the style itself. Track required vs stored counts so "complete" has a definition.

### 3. Honest progress and real states

Progress becomes "pieces successfully stored ÷ pieces required", so a failing tile lowers progress instead of inflating it. The button gains explicit states:

- Save Map → Preparing… → Downloading 42% → Finishing… → Verifying… → **Saved Offline** (distinct filled/check icon) → or **Download failed · Retry**

Saved Offline survives refresh, navigation and app restart because it is derived from the persisted record plus a cheap storage check, not session state.

### 4. Saved Maps management

A small "Saved maps" panel inside the existing map controls listing each saved area: name, approximate size, date saved, availability, and Remove. Removing returns that area's button to "Save Map" immediately.

### 5. Per-area saves

Move from one global tile blob to named areas (the whole Bible lands as the default area, plus the currently open place/journey area), each with its own record and state, so independent states work.

### 6. If it cannot be honest, say so

If verification shows the platform (most likely iOS in installed mode) cannot serve saved tiles to the map, the control will say offline maps are unavailable on that device rather than showing a fake "Downloaded" badge, and the Bible-lands fallback map stays as the offline experience.

## Technical details

- `src/lib/atlas/tile-cache.ts` — rework into an area-based store:
  - `type SavedArea { id, label, bounds, zooms, required, stored, bytes, savedAt, verifiedAt, state }` persisted in the existing IndexedDB (`meta` store, new `areas` key; bump `DB_VERSION`).
  - Job list gains glyph ranges (`/fonts/v1/mapbox/{font}/{range}.pbf`), sprite `@1x`/`@2x` json+png, and terrain-DEM tiles for the saved zooms.
  - Progress callback reports `{ stored, required, phase }` with phases `preparing | downloading | finalizing | verifying`; `stored` only increments on a confirmed `cache.put` + index write.
  - New `verifyArea(areaId)`: samples ~20 required keys via `caches.match(url, { ignoreSearch: true })`, confirms each returns a body, and confirms the IndexedDB row count matches; returns `{ ok, missing }`.
  - Quota handling: catch `QuotaExceededError` explicitly and surface it as a distinct failure reason; call `navigator.storage.persist()` before a save to reduce eviction.
  - Keep `clearAtlasTiles` but scope deletion to an area.
- Address-match check (do this first, it decides the rest): instrument the live map with a request log, compare the URLs `mapbox-gl` actually issues with the URLs the downloader stores, and align the downloader to the real shape. Drive this through Playwright against the running app; also check whether tile requests originating from map workers are intercepted by the service worker.
- `vite.config.ts` — keep the existing `atlas-map-tiles` runtime caching rule; extend the pattern only if the address check shows other hosts (e.g. `events.mapbox.com` exclusion is already there). No second cache name.
- `src/components/atlas/MapsExplorer.tsx` — replace the single icon button with a small floating offline-map control driven by a `useOfflineMaps()` hook (state machine: `idle | preparing | downloading | finalizing | verifying | saved | failed`), plus a compact "Saved maps" popover using the existing `useDismissibleLayer` pattern and card styling. No changes to map rendering, layers, selection, journeys or the SVG fallback.
- Tests: extend `src/lib/atlas/tile-cache.test.ts` for stored-vs-attempted progress, quota failure, verification failure producing `failed` (never `saved`), and area removal. Playwright lifecycle runs for tests A–G at 390 / 820 / 1440, including an offline-context render check. `bunx tsgo --noEmit` + `bunx vitest run`.

## Reported back at the end

Root cause, whether tiles were really downloading before, where data lives, how verification works, the new UI states, persistence model, offline test results, platform limitations found (especially iOS), and remaining gaps.
