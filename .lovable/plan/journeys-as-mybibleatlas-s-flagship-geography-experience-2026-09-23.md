# Journeys as MyBibleAtlas’s flagship geography experience

## Outcome

Rename the current **Maps** section to **Journeys** and make `/journeys` the canonical home for all eleven journeys. The experience will lead with visual discovery, then let readers follow each journey as a synchronized map-and-story sequence without introducing another map system.

All seven existing journeys remain available, and these four are added:

1. Jesus Through Samaria
2. Seven Churches of Revelation
3. Israel’s 40-Year Wilderness Journey
4. Jacob’s Journey

## Audit findings guiding the work

- The current seven journeys already share a strong static data and route-geometry system, one reusable Mapbox map, an offline SVG fallback, playback, Scripture links, saved maps, and crawlable text.
- The current section is presented as a flat card grid and the detail experience is map-first rather than story-first. Mobile loses most stop labels and chronology.
- The route model can support the four additions, but needs richer editorial metadata, search aliases, linked people/places, category information, and explicit geographic confidence.
- Seven Churches has the strongest geographic certainty. Jacob’s sequence is well supported, with some debated Transjordan sites. Jesus through Samaria needs careful wording around the direct Samaritan route and the disputed avoidance tradition. Most minor Numbers 33 stations cannot be responsibly pinned.
- Global Bible search does not currently surface journeys, Connections has no direct journey bridge, and journey analytics are absent.

## 1. Rename Maps to Journeys safely

- Make `/journeys`, `/journeys/$journey`, and `/journeys/$journey/$leg` the canonical routes.
- Rename visible navigation, breadcrumbs, headings, search results, sharing text, and accessibility labels from Maps to Journeys where they refer to this library.
- Permanently redirect `/maps`, `/maps/$journey`, and `/maps/$journey/$leg` to their `/journeys` equivalents while preserving `place`, `stop`, `from`, and other valid URL state.
- Preserve old reader, entity, timeline, shared, installed-app, and saved links by updating internal navigation and retaining redirects.
- Keep the existing place-selection and deep-link behavior within Journeys, including contextual return to the Bible.

## 2. Extend the journey content model

Add reusable, data-driven fields rather than journey-specific UI:

- category, featured status, short passage label, start/destination summary, people, aliases, and key context
- stop-level event title, concise significance, related people/places/events, Scripture passages, and geographic confidence
- optional overview stages for long journeys and detailed station lists for progressive disclosure
- journey-specific discovery styling using semantic tokens, without hardcoded page colors

Generate reverse journey links from the journey data where possible instead of expanding the current hand-maintained mapping.

## 3. Add and validate the four journeys

### Jesus Through Samaria

- Route Judea → Samaria → Sychar → Jacob’s Well → Galilee, with Mount Gerizim as contextual geography.
- Make John 4:4 and the meeting at Jacob’s Well the central story moments.
- Explain that the Samaritan route was direct and historically used; label the Perea-avoidance comparison as debated interpretation, not settled fact.
- Link John 4, Jesus, the Samaritan woman, Jacob, Sychar, Samaria, Jacob’s Well, Mount Gerizim, and Galilee where supported by existing records.

### Seven Churches of Revelation

- Begin with Patmos as context, then follow Ephesus → Smyrna → Pergamum → Thyatira → Sardis → Philadelphia → Laodicea.
- Show ancient and modern locations, Revelation 2–3 passages, each message’s central theme, historical context, distance to the next church, and “Church n of 7” progress.
- Use established locations and a restrained mixed maritime/land route from Patmos.

### Israel’s 40-Year Wilderness Journey

- Keep the existing Exodus journey as its own concise journey and add a distinct forty-year Numbers 33 experience.
- Default to major stages: Egypt → Red Sea → Sinai → wilderness regions → Transjordan → plains of Moab/Promised Land threshold.
- Expand on demand into the ordered Numbers 33 station list.
- Pin only established or defensible regional locations. Render unlocated stations in the textual itinerary without invented coordinates.
- Distinguish established, probable, traditional, debated, and unlocated geography clearly.

### Jacob’s Journey

- Follow Beersheba → Bethel → Haran/Paddan-Aram → Gilead → Mahanaim → Peniel → Transjordan Succoth → Shechem → Bethel → Bethlehem/Ephrath → Hebron.
- Keep the two biblical places named Succoth distinct in identifiers and copy.
- Connect the sequence to Jacob’s transformation: departure, Bethel dream, years with Laban, return, wrestling at Peniel, reconciliation, and return to Bethel.
- Label debated exact sites such as Mahanaim, Peniel, and Succoth appropriately.

## 4. Build a premium journey library

- Replace the flat list with a strong editorial introduction and a visually prominent Featured Journeys row.
- Feature Jesus Through Samaria, Exodus, Paul’s Missionary Journeys, and Israel’s 40-Year Wilderness Journey.
- Group the full library only where useful: Patriarchs; Exodus & Israel; Jesus; Early Church; Prophets & Kings.
- Use stable, lightweight route previews, concise passage/start/destination/stop/person information, and restrained category labels.
- Keep cards spacious and highly scannable, with one clear primary action and no nested card treatment.
- Make horizontal featured browsing and grouped discovery comfortable one-handed on phones, without hiding any journey.

## 5. Turn each journey into a map-led story

- Reuse the existing single Mapbox instance, static corridor geometry, camera logic, terrain styles, and offline SVG fallback.
- Present journey title, primary Scripture, concise context, and the map as the opening focus.
- Add a synchronized story timeline beneath or beside the map. Selecting a stop updates the current marker, emphasized segment, camera, verse, and explanation.
- Preserve Play, Pause, Continue, Next, and Restart; refine the existing progressive route drawing and gentle camera movement rather than adding decorative animation.
- Surface `when` information that is already authored but currently hidden.
- On mobile, use a map-native bottom sheet with collapsed, medium, and expanded states for Story, Stops, Scripture, and Context. On desktop, use a calm side panel while keeping the map dominant.
- Keep the selected journey, leg, stop, location, layer, camera context, and Bible return path stable as panels open and close.
- Respect reduced motion and provide the entire journey as keyboard- and screen-reader-accessible text.

## 6. Connect journeys across MyBibleAtlas

- Add journey results to global discovery for titles and aliases such as “woman at the well,” “seven churches,” “wilderness,” and “Jacob.”
- Keep map-local search and concordance behavior intact.
- Add contextual links from journey stops to available people, places, events, Scripture, related journeys, and Connections/Trace nodes.
- Add clear “Explore this connection” and “Read in the Bible” actions only when backed by existing data.
- Preserve return context so readers can always return to the passage that opened the journey.

## 7. SEO, crawlability, and redirects

- Give every journey and multi-leg page a unique title, description, canonical `/journeys/...` URL, Open Graph/Twitter metadata, and self-referencing URL.
- Extend the existing WebPage, BreadcrumbList, Place, citation, and ordered-stop structured data rather than creating a second SEO system.
- Render titles, summaries, stops, context, references, certainty notes, people, and place links in server-rendered HTML outside the interactive map.
- Move sitemap journey entries to `/journeys/...`; retain permanent redirects from every old `/maps/...` address.
- Update `llms.txt` and internal links to the canonical Journey URLs.

## 8. Performance, offline behavior, and analytics

- Keep geometry static and local: no routing API calls and no repeated map requests per stop.
- Lazy-load the existing map renderer, reconcile data into the existing instance, and keep lightweight static previews on the library page.
- Preserve saved-map records, tile verification, offline fallback, PWA behavior, translation state, and cache behavior across the URL rename.
- Add bounded journey analytics for library selection, journey start, stop selection, playback completion, and Scripture/Connections follow-through without storing reading content.

## 9. Validation

- Add integrity tests proving there are exactly eleven unique journeys, every mapped stop resolves, all Scripture links are valid, and uncertainty is explicit where required.
- Test old `/maps` redirects and new canonical `/journeys` URLs, including query/return-context preservation.
- Test journey alias discovery and generated reverse links.
- Test map/timeline synchronization, play/pause/restart/manual selection, reduced motion, and one-map reuse.
- Verify all seven existing journeys and all four new journeys on 320–430px phones, tablet, laptop, and desktop.
- Verify keyboard navigation, focus behavior, screen-reader labels, touch targets, no overflow/overlap, offline fallback, saved maps, reader return, Connections links, and crawlable raw HTML.

## Technical boundaries

- Keep TanStack file-based routing and the current Mapbox + offline SVG architecture.
- Do not create a second map, routing service, or journey-specific UI implementation.
- Do not invent identities, routes, coordinates, archaeological claims, or certainty.
- Do not pin unresolved Numbers 33 stations merely to make the map look complete.
- Preserve existing Bible reading, translations, search behavior, audio, offline/PWA, saved maps, entities, Connections, caching, and accessibility patterns.
