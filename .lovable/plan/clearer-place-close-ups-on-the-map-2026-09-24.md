# Clearer place close-ups on the map

## What exists today
- The app uses **Mapbox GL** (with the offline SVG atlas as fallback). Place pages link to the map with the place pre-selected.
- **No place has boundary data.** Places have one coordinate and a certainty label (known / probable / possible / traditional / unknown).
- When a place is selected the camera caps at zoom 8 (regional), to match the deepest zoom saved for offline use. That is why Bethel, Bethany, Gilgal etc. look too far away.

## What will change (place selection only — journeys untouched)
1. **Auto-zoom**: selecting a place flies (about 1 second, instant with reduced motion) to zoom ~12.5, max 13.5. If a place ever gets a boundary, fit to it with ~20% padding instead. Panning/zooming stays free afterwards (no snapping back).
2. **Pin + label**: a clear pin with the place name beside it, with a light halo so it reads on Topographic, Satellite and dark styles.
3. **Area**:
   - Boundary present: filled polygon (~18% opacity, 2px outline), selected one strongest; others from a fixed accessible palette.
   - No boundary (all places today): faint ~1 km circle, not an invented shape.
   - Uncertain places (possible / traditional / unknown, e.g. Gilgal, Emmaus, Sinai): dashed outline and "Approximate location" in the place card.
4. **Data**: optional `boundary` (GeoJSON polygon) field on places. Your requested `known | approximate | disputed` will be derived from the existing certainty labels, not duplicated. No coordinates or text changed.
5. **Offline**: close-ups beyond the saved-offline depth still work online; when offline the camera stops at the saved depth.

## Checks
Bethel, Bethany, Bethlehem, Gilgal, Joppa at 375px and desktop; pin, label, circle, dashed outline for Gilgal; free pan after zoom; no console errors; tests pass.

## Technical details
- `mapbox.ts`: `placesGeoJSON` emits pin + circle polygon (64-point circle from radius) or boundary; new layers `atlas-place-area-fill`, `atlas-place-area-line` (dashed via `certainty` property), pin symbol/circle + label.
- `MapboxAtlas.tsx`: selected-place camera uses `fitBounds(boundary)` or `flyTo({zoom:12.5, maxZoom 13.5, duration 1000})`, capped to offline max only when `navigator.onLine` is false.
- `catalogue.ts`: `boundary?` on MapFeature, `approximateCertainty()` helper; `MapPlaceCard` shows the note.
- SVG fallback unchanged apart from the approximate note.
