# Fix the offline map save and speed up place selection

Two separate problems on `/maps`, both fixable without touching the reader, journeys or anything else.

## 1. Saving the map stalls near the end

What the code does today: it downloads the map pieces six at a time and waits for every one of the six before moving on. Each download has no time limit and no retry. So if a single piece never answers — a dropped connection, or the map service briefly throttling us — the whole save freezes forever at whatever percent it had reached, and the button stays disabled.

Fix:
- Give every download a time limit (about 15 seconds) and up to two retries with a short pause.
- If a piece still can't be fetched, skip it and keep going, so the save always finishes instead of hanging.
- Only count a piece as saved when it really was stored, so the saved size and count are honest.
- Finish with a clear end state: the button shows the saved size, and if some pieces were skipped, the save can simply be run again to fill the gaps.
- Add a way to stop a save in progress (tapping the button again cancels).

## 2. Slow map when opening a location

When you tap a place such as Nazareth or Egypt, the map flies in to a closer zoom level than the one we save for offline use, so it has to fetch fresh map imagery from the internet every time — that is the pause you see.

Fix:
- Keep the place close-up within the zoom range we actually store, so those views come from what is already on the device.
- Include that zoom level in the offline save as well, so a saved map covers everything the app actually shows.
- Shorten the fly-in and avoid re-framing the map twice for a single tap, so the move feels immediate.

## Technical details

- `src/lib/atlas/tile-cache.ts`
  - `cacheUrl`: add `AbortController` with a 15s timeout; retry twice on network error/timeout/429/5xx with backoff; return `0` (not stored) on final failure.
  - `downloadAtlasTiles`: accept an optional `AbortSignal`; replace the blocking `Promise.all` batch with a bounded worker pool (6 concurrent) that always advances `done`; track `saved` vs `skipped` counts and only add `bytes`/index entries for stored tiles; write `bytes`/`savedAt` in a `finally` so partial progress persists.
  - Extend `ZOOMS` to `[4, 5, 6, 7, 8]` so the place close-up level is covered (region is small; this stays a modest download).
  - Return `{ tiles, bytes, savedAt, skipped }` and keep `TileCacheStatus` backwards-compatible.
- `src/components/atlas/MapsExplorer.tsx`: hold an `AbortController` while `tileProgress !== null`; the save button cancels instead of being disabled; surface skipped-tile count in the button title.
- `src/components/atlas/MapboxAtlas.tsx`: cap the selected-place `flyTo` zoom at 8 (matches cached zooms), reduce duration to ~600ms, and skip `frameContent` when the camera effect is about to run for the same change.
- Verify with `bunx tsgo --noEmit` and `bunx vitest run`; add unit tests for the retry/skip accounting in the tile cache.
