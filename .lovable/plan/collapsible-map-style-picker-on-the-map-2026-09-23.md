# Collapsible map-style picker on the map

## Problem
The topographic / satellite / 3D terrain selector on the map is permanently expanded as a three-row vertical panel pinned to the top-right. It sits over the map the whole time, competes with the zoom controls and place cards, and steals attention on phones — even though switching the map style is a rare, once-per-session action.

## Proposed fix — Layers button pattern (Apple Maps / Google Maps convention)

Replace the always-open panel with a single compact **Layers button** in the same top-right corner:

1. **Collapsed by default.** Only a 44px round Layers icon button is visible — same visual language as the existing zoom controls, so the map surface stays clear.
2. **Tap to open.** Tapping it expands a small floating menu with the three style options (Topographic, Satellite, 3D Terrain), each with its icon and a clear selected state on the active style.
3. **Dismisses itself three ways:**
   - Picking a style applies it and closes the menu immediately.
   - Tapping anywhere else on the map closes it (reusing the existing `useDismissibleLayer` hook already used elsewhere in the app).
   - Escape closes it on desktop, and focus returns to the Layers button.
4. **Remembers the choice.** The selected style is stored so returning visitors keep their preferred map without ever needing to open the menu again.
5. **Accessible.** The button is labeled ("Change map style"), the menu announces the active style to screen readers, and every target is at least 44px for touch.

## What stays the same
- The three map styles themselves and how they switch (no change to Mapbox logic).
- All map functionality: journeys, playback, search, offline save, cards, camera movement.
- The bundled offline SVG fallback map has no style panel, so it is unaffected.

## Technical details
- Edit only `src/components/atlas/MapboxAtlas.tsx`: swap the permanent button stack for a toggle + dismissible popover using the existing `useDismissibleLayer` hook and existing design tokens (`--color-map-chrome`).
- Persist the choice in `localStorage` under a `bible-atlas:` key, initialized on load.
- Keep the panel positioned top-right, stacked clear of the zoom controls; on phones it opens as a compact menu, not a sheet.
- No new dependencies, no new routes.

## Verification
- Typecheck + existing test suite.
- Browser check at phone (390px) and desktop widths: panel closed on load, opens on tap, applies a style and closes, closes on outside tap and Escape, choice persists across reload, and the map camera/journey behavior is unchanged.
