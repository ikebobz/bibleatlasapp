# One map everywhere

Today the app has two map surfaces. The new real-geography map lives only on the Maps page. Everywhere else — the small map inside a reading panel, place pages, and journey story pages like Abraham's journey — still draws the old illustrated map. And when a place such as Samaria does open the Maps page, there is no way back to the passage you were reading. This plan makes the new map the single map experience, without redesigning it.

## What happens today (audited)

- Tapping "Samaria" in a verse opens the context panel beside the passage. Inside it, curated content can include a small drawn map, and there's an "Explore interactive map" link.
- For a place, that link goes to the Maps page with the place selected — but it drops the passage you came from, so there's no return.
- For a journey, it goes to the journey story page, which still uses the old illustrated map.
- Place and people pages embed the old illustrated map too.

## What you'll see

**Reading → map**
- The small drawn map inside the reading panel is replaced by a clear "Open Samaria on the map" action (cheaper and faster than drawing a second map in the panel).
- It opens the new map with Samaria already centred, highlighted and its place card open — no searching.
- The map remembers where you came from and shows a "Back to John 4" action, so you return to the exact passage.

**Journey pages**
- Journey pages such as `/maps/abraham` keep their URLs, story timeline and back-to-passage action, but now render on the new real-geography map.

**Place and people pages**
- The embedded illustrated map becomes a link into the same canonical map with that place selected.

**Everything else stays**
- Same place card, same markers, same controls. With no connection and no saved map, the built-in illustrated atlas still appears automatically as the fallback.
- Mobile, tablet and desktop keep the existing responsive layout — the card floats over the map and the map stays pannable underneath.

## How places are chosen

The existing place database and relationships are reused: coordinates, nearby places, related journeys, related passages, modern names and certainty notes. Nothing new is fetched when you arrive from the reader.

## Camera behaviour

Opening a single place centres on it and zooms to a level that still shows the surrounding region (Samaria readable alongside Galilee, Judea and the Jordan Valley), capped at the zoom level saved for offline use so it opens instantly from saved data. Regions and seas frame wider than towns.

## Technical details

- `/maps` search params extend from `{ place, q }` to `{ place, q, journey, leg, stop, from }`. `from` reuses the existing `"book/chapter/verse"` convention and `readerReturn()` parsing already used by `/maps/$journey`; it is validated as a relative reader path only. Existing links keep working.
- `MapsExplorer` becomes the canonical surface (it already renders `MapboxAtlas` with `AtlasMap` as fallback). It gains `initialJourney`/`initialLeg`/`initialStop`/`back` props, syncs journey/leg/stop to the URL through the existing `selectPlace`-style `navigate` call, and renders a "Back to <reference>" button when `from` is present — shown for both place and journey states.
- `maps.$journey.tsx` keeps its route, loader, head metadata, canonical URL and `leg`/`from` params, but renders `MapsExplorer` with the journey preselected instead of `JourneyStoryPlayer`. `JourneyStoryPlayer.tsx` is left in place unused this pass and removed only after the journey route is verified.
- `BlockView`'s `map` block no longer renders `AtlasMap`; it renders a link into `/maps` with `place` (from the block's `focus`, resolved through `mapPlaceIdForEntity`) or `journey`, plus `from` set to the current reader path. `AtlasPanel`'s existing place link gains the same `from` its journey link already carries.
- `EntityDetail`'s inline `AtlasMap` is replaced by the same link treatment, keeping its "Open full map" affordance.
- `AtlasMap` stays strictly as the offline/no-token fallback inside `MapsExplorer`; after the switch, a repo search verifies no other import sites remain.
- Place selection already suppresses the journey route and renders `MapPlaceCard`; no second card is created. Selected-place camera uses the existing `flyTo` path with zoom capped at the offline zoom, varying by feature kind (city/archaeology closer, region/water wider).
- Verification: `bunx tsgo --noEmit`, `bunx vitest run`, plus Playwright at 390×844, 820×1180 and 1440×900 covering reader → Samaria → map → back to passage, reader → Jerusalem → nearby places, and Maps search → Samaria, confirming both entry points land on the same component and card. Spot-check Bethlehem, Nazareth, Galilee, Capernaum, Jericho, Damascus, Antioch, the Jordan and the Sea of Galilee from the place database.
