# Maps as Biblical Geographic Storytelling

## Product direction

Evolve Maps incrementally into a geographic context layer for Bible reading. Keep the current fast, offline-capable SVG atlas as the default foundation; add a richer, selectively loaded terrain experience only where elevation materially explains the story. Preserve all current map URLs, reader links, journeys, translations, offline reading, and non-map features.

## Verified audit

- **Foundation:** no external map provider or mapping SDK is currently used. `AtlasMap` is a custom React/SVG renderer with a linear projection, hand-authored coastlines, water, approximate modern borders, and static longitude/latitude data.
- **Current content:** 91 coordinate-backed places, seven journey experiences, 91 journey stops, and 45 curated place profiles. Journey stops already connect to Bible passages, dates/periods, notes, distances, and reader deep links.
- **Current routes:** `/maps`, `/maps/$journey`, `/places`, `/places/$slug`, plus map blocks inside the reader's contextual panel. Reader-to-journey return links already preserve the exact verse.
- **Current interaction:** journey playback, previous/next stop, scrubber, stop selection, route comparison, and an approximate present-day overlay. There is no direct pan, pinch/wheel zoom, marker clustering, search, layer manager, place selection card, or terrain.
- **Current data architecture:** map geography and journeys are static bundled data, not database/API records. The backend stores shared generated context, not geographic source data. Map data therefore has no ongoing API cost and remains available with the cached app shell.
- **Current 3D:** the app has a custom SVG viewer for objects, but no geographic 3D or elevation data.
- **Current responsive behavior:** the SVG scales to fit. Reader context is a mobile bottom sheet and desktop side panel, but Maps itself does not provide touch-first navigation or a tablet map-plus-panel layout.
- **Current gaps:** place pages link to the generic Maps hub instead of opening the selected location; only a small set of reader entries expose a journey CTA; uncertainty and source quality are mostly prose rather than structured metadata; straight lines and travel estimates can look more authoritative than the underlying evidence supports.
- **Performance profile:** current maps avoid tile/API cost, but animation re-renders the SVG each frame, every hub preview eagerly renders repeated geometry, and no level-of-detail or offscreen deferral is used.

## Phase 1 — Geographic data contract and integrity

- Create one normalized map catalogue that joins existing places, aliases, curated place profiles, reader entries, journeys, people, events, regions, and passage links without duplicating source content.
- Extend place metadata with structured fields for feature type, ancient/modern names, region, alternate names, location certainty (`known`, `probable`, `possible`, `traditional`, `unknown`), concise uncertainty wording, source note, related places, and supported layers.
- Treat routes and travel values explicitly as either straight-line measurement or historical estimate. Retain current haversine totals but relabel them accurately; never imply that a straight segment is the historical road taken.
- Add validation tests so every journey stop resolves to a place, every reader/map link resolves, aliases are unique, coordinates are valid, and uncertain sites always carry visible qualification.
- Keep data static and versioned in the application for this phase; do not add a map database or paid API where none is needed.

## Phase 2 — Core map canvas and responsive shell

- Refactor the SVG into reusable base geography, feature, route, marker, and label layers while preserving the existing `AtlasMap` behavior for reader panels.
- Add smooth cursor-centered wheel zoom, pinch zoom, drag pan, double-tap zoom, reset/fit controls, keyboard zoom, and visible scale. Use a maintained zoom library and constrain motion to useful biblical geography.
- Add zoom-dependent detail and collision-aware labels so distant views remain quiet and nearby views reveal more context. Cluster only dense point features; do not cluster route stops that need narrative order.
- Build a shared Maps shell:
  - **Phone:** full-height map, top search, compact layer control, and draggable bottom sheet.
  - **Tablet:** map with a persistent but collapsible information panel.
  - **Desktop:** main map canvas with a stable side panel and journey controls.
- Preserve the current visual identity and semantic color tokens; improve contrast, focus visibility, touch targets, reduced-motion behavior, screen-reader stop announcements, and scrubber value text.

## Phase 3 — Map home, discovery, search, layers, and place context

- Replace the current card-only `/maps` first view with an actual exploratory map while retaining journey discovery cards below/alongside it for SEO and direct navigation.
- Add focused discovery categories backed only by verified data: Places, Journeys, People, Events, Regions, Cities, Mountains, Rivers, and Archaeology. Hide empty or weak categories rather than fabricating coverage.
- Extend the existing entity aliases and catalogue into local map search for biblical names, modern names, people, journeys, regions, events, and common alternate names. Keep it local, debounced, and zero-cost.
- Add a progressive layer control. Default to biblical places plus the current context; make journeys, terrain-ready regions, rivers/mountains, archaeology, approximate historical regions, and modern orientation opt-in.
- Add meaningful restrained symbols by feature class, zoom-aware clustering, selected/related states, and an always-visible legend only when multiple non-obvious layers are active.
- Selecting a feature opens a compact contextual card/bottom sheet without moving away or losing the camera. Include name, modern location, certainty label, concise biblical significance, key passage, related people/journeys, nearby relevant places, distance, and Explore/Read actions.
- Give `/maps` shareable search state for selected place, active layers, journey, and leg while keeping clean canonical URLs.

## Phase 4 — Place pages and Bible-reader continuity

- Embed a focused map directly on coordinate-backed `/places/$slug` pages and make “See it on the map” open that exact place, not the generic hub.
- Connect nearby places using relevance first, distance second; for example, Nazareth should foreground Galilee, Cana, Capernaum, Bethlehem, and Jerusalem rather than arbitrary nearest pins.
- Enrich place context from existing curated content: modern/ancient names, region, key events, associated people, journeys through the place, relevant passages, archaeology, and explicit uncertainty.
- Extend the reader's current subtle highlighted-reference behavior so verified geographic entries can open the selected place in Maps with the current verse encoded for an exact return. Do not add map triggers to verses without meaningful geographic context.
- Keep the reader visible as it is today: mobile uses the existing contextual sheet; desktop keeps Scripture beside the context panel. Add a compact map preview before offering the full Maps experience.

## Phase 5 — Journey storytelling

- Recompose `/maps/$journey` as a map-first story player: map canvas plus the active stop card, passage, event, distance for the current leg, certainty note, and next-step action.
- Keep play/pause, scrub, previous/next, leg selection, stop tapping, and direct Scripture links; improve playback pacing so the story pauses meaningfully at stops instead of traversing every route in a fixed seven seconds.
- Show direction and mode of travel where known. Clearly distinguish straight-line distance, approximate travel distance, and estimated duration; omit unsupported precision.
- Make stop selection preserve map camera and panel state. Allow a location card to branch into related places or journeys and return to the same story step.
- Keep all seven current journeys and URLs. Improve them before adding more stories; additional journeys require the same passage, place, certainty, and source validation.

## Phase 6 — Selective terrain, cost-controlled

- Keep 2D SVG as the universal default and offline fallback.
- Add dynamically loaded Three.js terrain scenes only for a small verified initial set where relief explains the text: Galilee/Jordan Valley, Jerusalem and the Mount of Olives, and Sinai/wilderness travel.
- Use locally hosted, preprocessed public elevation data with recorded source/licence and bounded region assets; do not introduce a continuously billed terrain/tile API in the first release.
- Pair every terrain scene with one explicit educational takeaway, such as elevation change, valley barrier, watershed, or route constraint. Terrain is never decorative and never shown for uncertain geography without qualification.
- Gate terrain by device capability, reduced-motion/data preferences, and connection quality. Lower-powered devices receive the equivalent 2D relief/contour view with no loss of biblical context.
- Treat broader commercial basemaps or live global terrain as a later, separately approved option after usage and value are measured.

## Phase 7 — Performance, offline behavior, and regression safety

- Lazy-load the exploratory map and terrain code, defer offscreen journey previews, share base SVG definitions, cull out-of-view labels/features, and animate the route/moving marker without re-rendering unrelated map layers each frame.
- Keep startup bounded: load only the selected story/viewport detail, then progressively add layers. No mass marker or terrain load on first paint.
- Cache recently viewed selected-place state, contextual data, and saved journey data locally. The vector atlas remains usable offline; unavailable terrain/basemap imagery falls back to 2D with a clear, non-blocking message.
- Add automated tests for pan/zoom anchoring, touch/keyboard controls, layer state, clustering, search aliases, uncertainty labels, contextual cards, reader round-trips, journey playback, offline fallback, and current URL compatibility.
- Add Playwright checks at phone, tablet, and desktop sizes, including label overlap, bottom-sheet gestures, map/panel occlusion, reduced motion, low-power terrain fallback, and no regression in the reader.
- Measure Maps interaction readiness, route animation smoothness, initial feature count, map bundle size, offline recovery, and terrain load separately. No new paid service ships without an explicit cost ceiling.

## Delivery sequence

1. **Release A:** normalized data, validation, pan/zoom, responsive map shell, and exact-place deep links.
2. **Release B:** discovery/search/layers, contextual cards, place-page maps, and expanded reader integration.
3. **Release C:** journey story player and distance/uncertainty corrections.
4. **Release D:** three selective terrain pilots, capability fallback, and final performance/accessibility validation.

Each release remains independently usable and retains the current SVG fallback, so major changes can be evaluated without replacing working infrastructure.
