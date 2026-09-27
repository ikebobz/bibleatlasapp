# Jesus Through Samaria: route comparison and map framing

## Outcome

Turn the John 4 journey into a clear geographic comparison: Jesus’ emphasized route through Samaria alongside a quieter, explicitly qualified eastern alternative through the Jordan Valley/Perea. Users should understand the contrast immediately, follow each stop without losing the wider geography, and see a well-framed map on phones, tablets, and computers.

## Confirmed current-state findings

- The journey currently contains only the direct sequence: Judea → Samaria → Sychar → Jacob’s Well → Mount Gerizim → Sychar → Galilee.
- Its written context already says the Perea alternative existed but that avoidance of Samaria was not universal; the map does not yet visualize that distinction.
- The direct route uses curated static corridor geometry. Perea exists as a regional map point, but there is no authored comparison corridor from Judea through the Jordan Valley/Perea to Galilee.
- The live map frames only the primary route. During stop selection it fits only the active segment, which can remove awareness of the whole journey and ignores any comparison route.
- Camera padding reads visible top and bottom overlays, but it is not recalculated when those overlays resize, the viewport changes, or orientation changes.
- The offline atlas already accepts comparison routes, but the journey screen does not pass one in; its framing uses stop points rather than every sampled route coordinate.
- The current legend explains route progress and certainty, but not a primary-versus-alternative comparison.

## 1. Add an evidence-aware comparison route model

- Extend the shared journey model with an optional comparison route containing a title, short label, explanatory note, certainty/interpretation status, supporting places, and static geometry.
- Add the Samaria comparison as a reconstructed Judea → Jordan Valley/Perea → Galilee corridor using a small number of defensible regional control points.
- Keep this route outside the biblical stop sequence: it will not affect playback distance, stop count, progress, or Scripture chronology.
- Label it as a historically discussed customary alternative, not as a route John says Jesus considered or as a universal Jewish practice.
- Preserve the primary route and its existing stop order; validate duplicate Sychar story moments and the close Sychar/Jacob’s Well/Mount Gerizim cluster without inventing new biblical stops.

## 2. Render both routes through the one map architecture

- Extend the shared GeoJSON output so comparison geometry is emitted with an explicit secondary role and never participates in travelled progress.
- Add a restrained secondary Mapbox line: thinner, lower contrast, subtly dashed, and visually below the main route and markers.
- Pass the same comparison data to the SVG offline atlas, replacing its point-to-point comparison rendering with the same sampled static geometry.
- Keep Jesus’ route, the travelled segment, and the selected stop at the top of the visual hierarchy.
- Show only the supporting alternative geography that aids comprehension, principally the Jordan Valley/Perea context; do not add decorative markers or turn the comparison into a second journey.

## 3. Replace route-only framing with shared geometry-aware camera logic

- Build reusable bounds helpers that combine all sampled primary-route coordinates, comparison-route coordinates, and key stop points.
- Use those combined bounds for the initial view and the Fit Map action, with responsive maximum zoom and minimum geographic context rather than a fixed journey-specific zoom.
- When a stop is selected, frame the active stop and relevant primary segment with a controlled context envelope, while retaining enough of the full comparison geography to orient the user.
- Treat the tight Sychar/Jacob’s Well/Mount Gerizim cluster specially through geometry-aware minimum spans, not hardcoded camera coordinates.
- Observe the map container and overlay dimensions so framing is recalculated after the location card opens/closes, panel height changes, viewport rotation, safe-area changes, and desktop/mobile layout changes.
- Cancel or supersede stale camera transitions to prevent snapping and respect reduced-motion preferences.
- Apply equivalent framing behavior to the offline SVG atlas so fallback does not crop or materially change the story.

## 4. Make the contrast immediately understandable

- Add a compact two-route key on this journey only: “Jesus through Samaria” and “Alternative via the Jordan Valley/Perea.”
- Add one concise comparison explanation near the map story controls and a slightly fuller, crawlable explanation below the map.
- Make John 4:4 the central editorial moment: tension between Jews and Samaritans, the direct route through Samaria, the historically discussed longer alternative, and the significance of the well encounter.
- Keep wording precise: Scripture states that Jesus “had to go through Samaria”; the cultural explanation and avoidance route are historical interpretation, not explicit route instructions in John.
- Reuse the existing stop card for verse/event context rather than adding another floating panel.

## 5. Refine stop-by-stop behavior

- Preserve the full journey route and quiet alternative throughout playback.
- Emphasize the selected stop and current primary segment; keep the alternate route secondary and static.
- For each stop, retain the verse, event, note, distance, and certainty information already shown.
- Avoid overly close camera moves around Sychar, Jacob’s Well, and Mount Gerizim; maintain regional context while making the selected marker legible.
- Ensure play, pause, next, previous, restart, direct stop selection, URL state, and fallback continuity remain unchanged.

## 6. Validation and release

- Add unit tests for comparison geometry, combined bounds, primary/secondary GeoJSON roles, route-distance isolation, and responsive camera padding.
- Add integrity tests for the Samaria stop order, comparison status/copy, known place references, and static corridor availability.
- Verify the live map and forced offline atlas at phone widths 320–430px, tablet, laptop, and desktop.
- Exercise collapsed/open location cards, legend open/closed, orientation and viewport-height changes, manual stop selection, full playback, reduced motion, and the Fit Map control.
- Confirm all key stops and both routes remain visible without clipping or excessive zoom, labels do not become noisy, and no extra map instance or routing/API request is introduced.
- Run the focused map tests, full test suite, type checking, and browser console checks.
- Release as the next patch version with a concise release note.

## Technical boundaries

- Keep the current TanStack routes, one reusable Mapbox map, and SVG offline fallback.
- Keep all route geometry static and local; no routing API or second map system.
- Use semantic design tokens for the secondary route and comparison key in both themes.
- Preserve saved maps, offline/PWA behavior, reader return context, translation state, SEO, Connections, and existing journey URLs.
