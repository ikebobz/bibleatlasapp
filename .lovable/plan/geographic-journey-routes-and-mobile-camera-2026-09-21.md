# Geographic journey routes and mobile camera

Upgrade the existing canonical Mapbox journey experience rather than adding another map. The current app already builds static, smoothed paths from curated corridor waypoints for every journey segment, and both Mapbox and the offline atlas consume that shared path. The remaining gaps are presentation and structure: Mapbox frames stop coordinates instead of the complete path, playback reveals the active stop but not the route progressively, camera movement uses a fixed close zoom without card-aware padding, travel mode is only stored at whole-leg level, and the offline moving marker still interpolates directly between stops.

## 1. Formalize the reusable route model

- Extend each curated stop-to-stop corridor with segment metadata: `walking`, `maritime`, or another supported mode; `verified`, `approximate`, or `schematic` confidence; and a concise geographic/source note where needed.
- Derive journey segments from the existing ordered stops and corridor table, keeping Scripture references and stop content in the current journey records.
- Preserve the current static, bundled geometry approach. No Directions, Map Matching, or per-view route API calls will be introduced.
- Keep a documented fallback for future segments without curated geometry, but mark it as schematic instead of presenting it as a historical route.
- Add integrity checks so every shipped journey segment has geometry, a route mode, and an accuracy classification.

## 2. Render segmented, progressive route geometry

- Change the shared GeoJSON builder from one undifferentiated route feature into ordered segment features carrying segment index, mode, confidence, and travelled/future state.
- Keep one Mapbox map and one source; update source data during playback rather than creating new maps or layers.
- Show the complete route first as a quiet contextual path, then progressively reveal the travelled path as playback advances. Stops become visually active in sequence, with clear but restrained start, current, and destination hierarchy.
- Use subtle solid styling for walking routes and subtle dashed styling for maritime segments, without oversized arrows or heavy lines.
- Make progression distance-aware so the moving state follows every sampled waypoint instead of jumping or interpolating directly between stop coordinates.
- Apply the same route geometry, progress, route-mode styling, and moving-marker logic to the bundled offline atlas.

## 3. Replace fixed camera movement with geometry-aware framing

- Compute bounds from all sampled route coordinates, not only stop markers.
- Add reusable camera helpers for full-route bounds, one-segment bounds, route length/span classification, and responsive padding.
- On initial load, frame the complete route with an appropriate maximum zoom; short journeys receive a closer frame and long journeys retain geographic context.
- During play, next/previous, or direct stop selection, frame the active segment plus its endpoints rather than using the current fixed zoom-to-point behavior.
- Keep camera bearing neutral by default and use restrained pitch only for terrain where it improves geographic understanding.
- Respect reduced-motion preferences by applying the final route and camera state immediately.

## 4. Make camera padding aware of the actual interface

- Measure the visible top controls, location/Scripture card, bottom timeline, and safe areas in the existing explorer.
- Pass those insets to the canonical map so `fitBounds` and segment camera moves keep the route clear of overlays.
- Recalculate after orientation changes, resizes, card open/close, and mobile bottom-sheet height changes without recreating the map.
- Keep the existing map UI and controls. Add a compact restart action alongside play/pause, previous, and next; suppress nonessential stop labels at narrow widths rather than crowding the map.

## 5. Correct historical language and mixed travel behavior

- Replace wording that claims an exact “historic route” with clear “approximate route” or “schematic route” language according to segment confidence.
- Remove the outdated offline message that still calls the distance a straight-line estimate.
- Calculate distance and travel estimates per segment mode, so a journey can combine walking and sailing rather than treating the whole leg as one mode.
- Keep every existing location card, Bible reference, reader return link, marker, deep link, style switcher, offline save, and search flow intact.

## 6. Verification

- Unit-test route segmentation, full and partial path geometry, geometry-derived bounds, mode/confidence metadata, mixed-mode distances, and camera-padding calculations.
- Retain the all-journeys corridor coverage test and add regression checks that no shipped journey defaults to a two-coordinate straight line.
- Verify at least Paul’s first journey, the Exodus, Jesus’ ministry/Galilee route, and the journey around Jerusalem; also verify a Samaria place deep link still opens the existing place card and marker.
- Check playback, pause, restart, previous/next, manual map exploration, route visibility around cards, and offline fallback parity.
- Test portrait widths 320, 375, 390, and 430 px, plus tablet and desktop, confirming no overlapping controls, clipped route, hidden endpoints, or disorienting camera jumps.
- Run the focused map tests, full test suite, and type checks before reporting completion.

## Technical notes

- Primary files: `src/lib/atlas/corridors.ts`, `src/lib/atlas/journeys.ts`, `src/lib/atlas/mapbox.ts`, `src/components/atlas/MapboxAtlas.tsx`, `src/components/atlas/MapsExplorer.tsx`, and `src/components/atlas/AtlasMap.tsx`.
- The route geometry remains bundled and cached with the app, so switching journeys does not add routing requests or additional Mapbox map loads.
- Existing route URLs and journey data remain backward-compatible; new segment metadata is derived through shared helpers instead of creating a second journey system.
