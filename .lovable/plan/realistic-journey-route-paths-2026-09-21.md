# Realistic journey route paths

Journeys are currently drawn as straight lines between stops, and distances are straight-line ("as the crow flies") sums. Real travel followed coastal roads, river valleys, mountain passes and sea lanes. This plan makes the drawn routes look and measure like real travel, without any new map API calls.

## What changes for the reader

- Journey lines curve and bend along plausible historic corridors instead of cutting straight across seas, deserts and mountains.
- Sea legs arc along known shipping lanes and hug coastlines; land legs follow known roads (Via Maris, King's Highway, the Roman road network in Asia Minor).
- Distances are measured along the drawn path, so the Paul leg reads closer to real travel than the current 1,784 km straight-line figure, with wording that keeps it honest ("approx.").
- Everything else stays the same: stop numbers, cards, playback, "Read in Bible", offline map.

## Approach

1. **Curated waypoints (accuracy).** Add an optional `via` list of coordinates to each stop-to-stop segment, held in a new route-corridor table. Waypoints come from known ancient roads and sea lanes, not guesswork: coastal points for sea crossings, pass and valley points for land crossings. Segments with no curated corridor fall back to the current behaviour.
2. **Smooth interpolation (visual).** Feed each segment's endpoints plus its waypoints through a Catmull-Rom style smoothing that samples along the great-circle, producing a gently curved polyline rather than hard elbows.
3. **One shared path builder.** Both the interactive map and the offline fallback map read from the same function, so they can never diverge.
4. **Distance from the path.** Cumulative distance sums the sampled path segments. Where no corridor is curated, apply a documented land-detour factor rather than pretending a straight line was walked; sea segments stay near great-circle since ships did sail direct-ish.
5. **Label honestly.** Distance labels get "approx." and the journey pages note that routes follow the best-attested corridors, with exact paths uncertain.

## Technical notes

- New `src/lib/atlas/corridors.ts`: `CORRIDORS: Record<string, [number, number][]>` keyed by `"fromPlaceId>toPlaceId"`, plus `segmentPath(from, to)` returning sampled `[lon, lat][]` and `pathLengthKm(path)`.
- `routeGeoJSON` in `src/lib/atlas/mapbox.ts` builds its `LineString` from concatenated `segmentPath` output instead of raw stop coordinates; stop points are unchanged.
- `AtlasMap.tsx` route polylines project the same sampled path; the animated progress dash still works because it uses `pathLength`.
- `legDistances` / `totalDistanceKm` in `journeys.ts` switch to `pathLengthKm`; `travelEstimate` unchanged.
- Corridors added first for Paul's journeys (Acts 13–14 and onward), Abraham, Exodus and Jesus' travels; other journeys degrade gracefully to smoothed direct paths.
- Unit tests: corridor path stays monotonic between endpoints, path length ≥ great-circle length, missing corridor falls back cleanly, distances stay within a sane band of published estimates.
