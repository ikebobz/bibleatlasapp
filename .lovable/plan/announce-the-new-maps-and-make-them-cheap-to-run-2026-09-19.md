# Announce the new maps, and make them cheap to run

Two parts: tell readers about the real-geography maps with a proper version entry, and change how the map is loaded so it uses far fewer paid map requests.

## 1. Version 2.7.0 — "Real geography maps"

Add a new release at the top of the release notes, dated today, and bump the app version to 2.7.0 so the "What's new" badge, banner and `/whats-new` page pick it up automatically (they all read from the same list).

Entry contents:
- **Real terrain, satellite and 3D** — the maps page now shows actual mountains, valleys, coastlines and rivers, with a switcher between topographic, satellite and 3D terrain.
- **See the journey at a glance** — every journey draws its route line and numbered stops the moment the map opens.
- **Save the map for offline** — download the biblical world once and keep exploring with no connection, like the Bible downloads.
Each item links to `/maps`.

## 2. Use far fewer map requests

Mapbox charges per map load (each time a map is created), not per tile inside a session. Today the map is torn down and recreated whenever the journey, leg, or place selection changes, so a single browsing session can bill many loads. Changes:

- **One map per visit.** Stop recreating the map on journey/leg/place changes — keep a single instance and just update its data and camera. This alone removes most of the billed loads.
- **Only create the map when it is really used.** Keep showing the built-in atlas immediately; create the real map once the page is actually visible and idle, so bots, prerenders, and bounced visits cost nothing.
- **Prefer saved tiles.** If offline map data has been saved, serve the map from it first and only reach the network for what is missing.
- **Cache the style once.** The style description is fetched per map creation today; cache it in memory and in the offline store so repeat views and style switches do not refetch it.
- **Cheaper style switching.** Switching topographic/satellite/3D reuses the same map instead of rebuilding it.
- **Keep the free fallback.** No token, no connection, or any map error still falls back to the built-in parchment atlas, unchanged.

A short note in the release entry tells readers the map keeps working offline once saved.

## Technical notes

- `src/lib/release-notes.ts`: new `2.7.0` entry (icons `map`, `waypoints`, `cloudOff`); `src/lib/version.ts`: `APP_VERSION = "2.7.0"`.
- `src/components/atlas/MapsExplorer.tsx`: drop the remount `key` on `MapboxAtlas`; mount it once and pass route/stop/place as props.
- `src/components/atlas/MapboxAtlas.tsx`: creation effect gated on an idle+visible signal (`requestIdleCallback` + `IntersectionObserver`), data changes go through `getSource().setData`, style switch reuses `setStyle` with the merged style, terrain toggled declaratively.
- `src/lib/atlas/mapbox.ts`: memoise `buildAtlasStyle` per style id, persist the style JSON alongside the tile cache.
- `src/lib/atlas/tile-cache.ts`: unchanged storage format; add a lookup used before network fetches.
- No changes to the reader, translations, search, concordance, AI, offline Bible downloads, sharing, PWA, auth, routes or database.
