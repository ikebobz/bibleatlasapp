# Recreate the reference-video interface on `/maps`

## Goal
Turn the existing `/maps` SVG explorer into the map-first experience shown in the reference video. The map stays full-screen and interactive, while compact controls, journey progression, location details, contextual insight, and Scripture appear as floating overlays. Existing journey detail pages remain unchanged.

## What will change

1. **Make the `/maps` map the primary screen**
   - Remove the article-style introduction from above the map so the SVG fills the available viewport immediately.
   - Keep the existing URL, SVG geography, pan/zoom, terrain, place catalogue, search, and offline-safe bundled data.
   - Preserve the featured journey and explanatory content below the immersive map for discovery and search visibility.

2. **Add the reference-style top controls**
   - Place a compact journey selector at the upper left, starting with the existing Jesus journey to match the Matthew-focused reference.
   - Add lightweight circular zoom, reset/fit, terrain, layers, search, share, and save controls over the map.
   - Reuse the existing control behavior and design-system buttons rather than duplicating map logic.

3. **Add journey playback directly to `/maps`**
   - Feed the selected journey and leg into the existing SVG route renderer.
   - Draw the route progressively and keep the current stop visually prominent.
   - Support play, pause, previous, next, direct stage selection, and timeline dragging.
   - Smoothly frame each selected stop while respecting reduced-motion preferences.

4. **Recreate the floating cards**
   - **Location card:** current place, ancient/modern context, cumulative straight-line distance, existing travel estimate, passage, and concise event summary.
   - **Context card:** a short geographic, historical, archaeological, political, or biblical explanation derived from existing catalogue and journey data.
   - **Scripture card:** the linked reference and translation-aware excerpt using the existing offline-first chapter cache, plus a link into the reader.
   - Cards will be dismissible/minimizable and will update with the active timeline stage.

5. **Match the reference composition responsively**
   - Desktop/tablet: map remains unobstructed with location and context cards positioned at opposite edges and the timeline along the bottom.
   - Mobile: cards collapse into compact bottom-sheet-style panels above a thumb-reachable timeline; controls stay clear of one another and the audio bar.
   - Ensure labels, touch targets, map gestures, and card text do not overlap at phone, tablet, or desktop sizes.

6. **Preserve explorer behavior**
   - Keep place search, categories, place selection, and journey discovery available as compact overlays/drawers instead of a permanent side panel.
   - Preserve `?place=` and `?q=` links and add URL-safe journey/leg/stage state only where useful.
   - Selecting a standalone place shows its existing place card without forcing journey playback.

## Technical details
- Extend `MapsExplorer` as the `/maps` experience and reuse `AtlasMap`; do not replace the map provider or introduce tile/API costs.
- Extract or share presentation logic from the existing journey story player only where needed, without changing `/maps/$journey` behavior.
- Reuse `JOURNEYS`, `legDistances`, `travelEstimate`, `MAP_FEATURE_BY_ID`, `chapterQuery`, translation settings, and native sharing.
- Keep all map and journey data bundled so the core experience remains usable offline; Scripture excerpts continue through the current cache-first reader path.
- Use semantic tokens and existing motion utilities, with no new unrelated backend or reader changes.

## Verification
- Test `/maps` at phone, tablet, and desktop sizes.
- Verify map pan, wheel/pinch zoom, controls, search, place selection, journey switching, route playback, timeline scrubbing, cards, sharing, saving, and reader links.
- Verify reduced motion, slow/offline behavior with cached Scripture, existing `?place=` and `?q=` links, and that `/maps/$journey` remains unchanged.
- Run the existing regression tests and targeted browser checks for the full map → journey → Scripture → reader flow.
