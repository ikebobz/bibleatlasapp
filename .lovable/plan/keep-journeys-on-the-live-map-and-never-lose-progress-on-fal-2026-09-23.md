# Keep journeys on the live map, and never lose progress on fallback

## What the code does today (confirmed by reading it)

Paths that switch from Mapbox to the Offline atlas (all end in `setMapboxFailed(true)` or flip `useMapbox` in `MapsExplorer.tsx:123`):

1. `MapboxAtlas.tsx:250` — mapbox-gl library/CSS fails to load.
2. `MapboxAtlas.tsx:325` — style JSON fetch/build throws.
3. `MapboxAtlas.tsx:301-304` — any `error` event with status 401, 403 **or 404**. Mapbox fires `error` for individual tiles, so one missing tile (common on the sea/terrain sources while flying across Cyprus to Perga) is enough to kill the map.
4. `MapboxAtlas.tsx:315-318` — a one-shot 12 s timer that falls back if `map.isStyleLoaded()` is false. After start, this is true while new tiles/sources load mid-flight, so it can fire during a `flyTo`. In the repro, play starts ~idle + a few seconds after creation; Antioch → Salamis → Paphos at 2.8 s per stop plus camera flight lands right around the 12 s mark — this is the likely trigger, with the 404 tile path as the second candidate. The temporary logging below will confirm which one.
5. `MapsExplorer.tsx:123` — `useMapbox` also requires `online`; a brief `offline` event on mobile flips to the atlas, and back again when `online` returns (the flip-flop the brief forbids).

No WebGL context-loss handling exists; no periodic `loaded()` check exists beyond the 12 s timer.

Why progress resets: playback `stop`/`playing` already live in `MapsExplorer`, but the Offline atlas (`AtlasMap`) keeps its own `progress` starting at 0. On mount, its `activeStopIndex` effect (`AtlasMap.tsx:285-288`) runs after the `selectedStop` effect and calls `onActiveStopChange(0)`, which overwrites the parent's stop with 0 (Antioch, "0 of 2,030 km"). `AtlasMap` also has its own internal `playing` flag, so the parent's play button stays on "pause" while nothing matches.

## Step 1 — Investigate (temporary, behind a DEBUG flag)

- Add `src/lib/atlas/map-debug.ts` with `DEBUG_MAP` (on when `localStorage.atlasDebug === "1"` or `?mapdebug=1`) and a `mapWarn(reason, details)` helper.
- Call `mapWarn` at every path above with the reason and error details (status, sourceId, tile URL, `isStyleLoaded()` value, elapsed ms).
- Reproduce the Acts 13 → Antioch → First missionary journey flow in Playwright at 390px and 1280px, read the console, and report which trigger fired.

## Step 2 — Fix

1. One fallback decision point in `MapboxAtlas`:
   - Style not loaded: no `load` event within 10 s of creation → fall back. The timer is cleared on `load` and never re-checks afterwards.
   - `error` events: fall back only for 401/403/429 on the style or on a tile/source request. Everything else (404, single tile, sprite, glyph, network blips) is logged and ignored.
   - `webglcontextlost` on the canvas: start a 3 s timer; `webglcontextrestored` cancels it; otherwise fall back.
   - Remove the `isStyleLoaded()` check. No `loaded()`/`isStyleLoaded()` used as a failure signal anywhere.
   - `onFallback` passes a reason string (logged under DEBUG).
2. Sticky for the session: `MapsExplorer` keeps `mapboxFailed` in a module/session flag so once it switches it stays on the Offline atlas (including across journey/leg changes and remounts during the visit). Going offline mid-journey no longer flips back and forth: the `online` check only decides the initial surface.
3. Shared playback state:
   - `MapsExplorer` is the single owner of journey id, leg, stop index, playing/paused and a `routeProgress` value (0..stops-1, animated). Both maps read it.
   - `AtlasMap` gets controlled props (`progress`, `playing`) and no longer notifies stop 0 on mount; its internal play loop is not used on `/maps` (`routeControls={false}` already hides its buttons). Distance shown in the card is derived from the shared stop/progress, so the switch shows the same stop and km and keeps playing if it was playing.
   - `MapboxAtlas` reads the same progress instead of starting its own animation from 0.
4. Note on switch: replace the "Offline atlas" chip text with "Live map unavailable, showing offline atlas" when the switch came from a failure (same position/style, non-blocking, `role="status"`). Plain offline-by-choice keeps the existing chip.

No changes to journey data, geometry, stop content, layout, Mapbox style, Offline atlas design or token handling (a 401/403/429 will be reported, not patched).

## Verification

- Playwright, 390px and 1280px: play the first missionary journey to the last stop 3 runs in a row; assert `data-testid` surface stays Mapbox and no fallback warnings.
- Throttle to Slow 4G (CDP) and inject random tile 404s/aborts: no fallback.
- Block `api.mapbox.com` before load: Offline atlas loads, journey plays through.
- Block `api.mapbox.com` mid-journey + force a 403: switches at the same stop/km, still playing, note visible, never switches back.
- Typecheck and existing tests; add unit tests for the fallback-decision helper (status/kind → fall back or ignore).

## Report at the end

Which trigger caused the original switch, and the files changed (expected: `MapboxAtlas.tsx`, `MapsExplorer.tsx`, `AtlasMap.tsx`, new `map-debug.ts` + test). Patch-level version bump and release note.
