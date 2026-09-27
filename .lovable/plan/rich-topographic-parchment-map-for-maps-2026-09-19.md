# Rich topographic parchment map for `/maps`

## Goal
Make `/maps` visibly feel like a premium historical Bible atlas. Preserve the existing working journey controls, playback, search, cards, reader links, and offline behavior, while replacing the flat map appearance with a richer topographic parchment treatment.

## Confirmed problem
The live map already includes the new controls, cards, and timeline. However, its underlying SVG is still dominated by oversized flat water polygons, a low-contrast beige texture, clustered markers, and minimal geographic detail. This makes the redesign appear largely unchanged.

## What will change

1. **Rebuild the SVG terrain treatment**
   - Add layered land elevation zones, ridge and contour lines, hillshade, escarpments, desert texture, and coastal depth using bundled SVG geometry and filters.
   - Give seas, lakes, and rivers distinct texture and edge treatment instead of uniform pale fills.
   - Add a restrained parchment grain and vignette through semantic map tokens, with a fully legible dark-theme equivalent.

2. **Improve geographic readability**
   - Add regional, sea, river, and mountain labels with clear cartographic hierarchy.
   - Reduce marker collisions around Galilee and Jerusalem through zoom-aware labels, selective label offsets, and clearer active/upcoming states.
   - Frame the selected journey at a useful regional scale so the first view shows recognizable geography rather than one enlarged coast segment.

3. **Strengthen journey storytelling**
   - Separate completed, active, and upcoming route segments visually.
   - Use numbered stop markers, a more prominent active-location halo, route direction cues, and subtle distance/sequence context.
   - Keep existing smooth camera movement and playback, but avoid zoom levels that make the map lose geographic context.

4. **Refine the floating interface**
   - Apply the selected topographic parchment-atlas styling to the existing journey selector, location card, context card, and timeline.
   - Keep controls compact and visually secondary to the map.
   - On phones, preserve thumb reach and collapse secondary context so the map remains visible behind the location card and timeline.

5. **Preserve the rest of Bible Atlas**
   - Limit the richer composition to `/maps`; journey detail pages and embedded reader maps remain unchanged unless they consume neutral, backward-compatible SVG improvements.
   - Keep all geography bundled and offline-safe—no paid map provider, external tiles, or new network dependency.
   - Preserve search parameters, sharing, saved journeys, Scripture loading, translation selection, and reader navigation.

## Technical details
- Extend the existing SVG geography with reusable terrain and label datasets rather than replacing the map engine.
- Add semantic map tokens in the global design system for parchment, relief, contours, coastlines, route states, and overlays.
- Add a `/maps`-only rich presentation mode to `AtlasMap` so other map usages retain their current composition.
- Refine cinematic framing calculations and label visibility by zoom level.
- Keep animation reduced-motion safe and avoid expensive continuous filters on constrained devices.

## Verification
- Compare `/maps` before and after at phone, tablet, and desktop sizes; the terrain and geographic structure must be immediately visible before interacting.
- Verify zoom, pan, fit, layers, search, place selection, journey switching, playback, timeline scrubbing, Scripture card, sharing, saving, and reader links.
- Check label/card/control collisions around Nazareth, Jerusalem, and multi-stop Paul routes.
- Run the existing type and regression tests, plus focused browser screenshots for the final visual result.
