# Real-geography Maps with Mapbox

Replace the flat SVG surface on `/maps` with real Mapbox geography — satellite, terrain, hillshade, rivers — while keeping the existing parchment SVG atlas as the automatic offline/no-token fallback.

## What you'll see

- `/maps` renders a full-screen real map: true coastlines, mountains, valleys, and rivers in the Bible lands.
- A style control switches between **Outdoors** (topographic with hillshade and rivers), **Satellite** (satellite imagery with labels), and **Terrain 3D** (elevated 3D relief using Mapbox's elevation data).
- The existing video-style interface stays on top unchanged: journey playback, bottom timeline, stop buttons, location/context/Scripture cards, search, share/save, and numbered stops.
- Journeys and places are drawn as live layers on the real map (route lines, stop markers, labels) instead of SVG overlays.
- When offline, when the token is missing, or when the map fails to load, the app automatically falls back to the current parchment SVG atlas — nothing breaks.
- `/maps/$journey` (JourneyStoryPlayer) and the reader remain untouched.

## What I need from you

Your **Mapbox public access token** (starts with `pk.`): Mapbox dashboard → Tokens → copy the default public token, and paste it in chat. It is a publishable browser key, so it is safe to paste and will live in the app's public env config. In the Mapbox dashboard, optionally restrict it to `mybibleatlas.com` and the preview domain for safety. No secret key (`sk.`) is needed — the app makes no server-side Mapbox calls.

## Technical details

- Add `maplibre-gl` (free, open-source renderer; works with Mapbox styles/tiles using the public token).
- `src/lib/atlas/mapbox.ts`: token from `import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN`; style URLs `mapbox://styles/mapbox/outdoors-v12` and `mapbox://styles/mapbox/satellite-streets-v12`; 3D terrain via Mapbox's `mapbox-terrain-rgb` DEM source with exaggeration control.
- New `MapboxAtlas.tsx`: full-screen map; converts journeys/stops/places from `geo.ts` into GeoJSON sources (route LineStrings per leg, stop circle + number symbol layers, place labels); journey playback drives a camera `flyTo` per stop (mirroring current cinematic timing, skipped under reduced motion); rivers/terrain come from the style itself.
- `MapsExplorer.tsx`: renders `MapboxAtlas` when a token exists and network is available, else the existing `AtlasMap` (unchanged, still used offline and in tests). Style switcher joins the floating layer controls. No URL, card, timeline, search, or save/share behavior changes.
- Fail-safe: map load error or offline event → instant swap to SVG atlas with the same props; a small notice shows "Offline atlas".
- Cost: Mapbox free tier is generous (50k map loads/month); no billing change required now.
- Tests: keep all 113 passing; add unit tests for the GeoJSON conversion helpers. `bunx tsgo --noEmit` + `bunx vitest run` + Playwright checks at 390×844 / 820×1180 / 1440×900.
