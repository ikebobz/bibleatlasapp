# Maps product roadmap

## Genesis 1 tree context
- [x] Replace the misleading Roman-cross link with a Genesis-only fruit-bearing tree entry
- [ ] Verify the Genesis 1:12 tap and related links on phone and desktop

## Reader context cues
- [x] Show quiet map and 3D cues only for linked words backed by existing content
- [x] Verify cues, accessible labels, and quiet reading on phone and desktop

## Mobile reader controls and place peek
- [x] Merge playing audio and chapter actions into one compact mobile bar; retain desktop audio controls
- [x] Open verse locations in an expandable interactive map peek with honest elevation availability and full-map return
- [x] Verify narrow-phone controls, mobile map gestures, reader link, and regression tests
- [ ] Confirm real-device playback and map peek after publishing (requires a published version and device access)

- [x] Release A: normalized map catalogue and integrity tests
- [x] Release A: pan, zoom, touch, keyboard, scale, accessibility
- [x] Release A: responsive map shell and exact-place links
- [x] Release B: map discovery, local search, layers, contextual place cards
- [x] Release B: focused place-page maps and reader continuity
- [x] Release C: journey story player, pacing, distance and uncertainty labels
- [x] Release D: selective terrain pilots with low-power/offline fallback
- [x] Responsive, offline, regression, and performance verification

## Reference-video story experience

- [x] Recompose journey pages as immersive map-first story players
- [x] Add responsive floating location, context, and Scripture cards
- [x] Add stage timeline, play/pause, previous/next, and direct stop selection
- [x] Add smooth selected-stop camera focus and clearer route direction
- [x] Add compact share, save, layers, terrain, and map navigation controls
- [x] Preserve exact reader return links and offline-safe bundled data
- [x] Verify reader → map → story → verse → map on phone, tablet, and desktop

## Reference-video interface on `/maps`

- [x] Make the SVG map the full-viewport primary surface
- [x] Add journey selector, floating controls, and journey playback
- [x] Add responsive location, context, and Scripture cards
- [x] Preserve search, categories, place links, sharing, saving, and offline behavior
- [x] Verify phone, tablet, desktop, and regressions

## Rich topographic parchment map on `/maps`

- [x] Add layered terrain, hillshade, contours, coast depth, and geographic labels
- [x] Improve journey framing, route states, and stop-marker hierarchy
- [x] Refine `/maps` cards and timeline to the parchment-atlas direction
- [x] Verify interactions and layouts on phone, tablet, and desktop

## Real-geography Maps with Mapbox (approved plan)
- [x] Mapbox GL wired in (lazy-loaded; no SSR/bundle impact)
- [x] Real topographic / satellite / 3D-terrain style switcher on /maps
- [x] Journeys, stops, and places rendered as live map layers with camera follow
- [x] Automatic fallback to the offline SVG atlas (no token, offline, or map error)
- [x] GeoJSON helpers + tests (120 tests passing)
- [x] Add Mapbox public token and verify live tiles on /maps

## Geographic journey routes and mobile camera

- [x] Add segment mode, accuracy, notes, and reusable geometry metadata
- [x] Render walking and maritime segments with progressive journey states
- [x] Frame full routes and active segments from their sampled geometry
- [x] Add responsive camera padding and reduced-motion handling
- [x] Keep the offline atlas on the same geometry and moving path

## UI/UX reliability and navigation

- [x] Keep selected map locations stable when details are minimized
- [x] Add safe return navigation for map entries and deep links
- [x] Standardize outside-click, Escape, and focus-return behavior
- [x] Improve high-frequency mobile touch targets and section discovery
- [x] Verify reader, map, overlay, and responsive flows

## Release 2.10.0 — clarity, accessibility, and mobile polish

- [x] Trap focus in true modal dialogs and restore it on close
- [x] Coordinate audio, update, install, offline, and first-run notices
- [x] Standardize loading, empty, error, and offline states
- [x] Compact People, Places, and entity cards on phones
- [x] Complete lower-frequency accessibility and touch-target fixes
- [x] Add a shared journey-map legend for both map surfaces
- [x] Verify responsive, keyboard, offline, map, and reader regressions

## 2.11.0 — People section
- [x] Pharaoh modelled as a title plus Joseph's, the Exodus, Shishak and Neco
- [x] ~55 further profiles (patriarchs, judges, kings, prophets, apostles, Acts figures)
- [x] Person profiles gained key passages, related people/places, map link, certainty notes
- [x] Map back control now names the person or place you came from
- [ ] Remaining thin names: Hophra, Potiphar, Sisera, Nabal, Ahithophel, Adonijah, Hiram, Asa, Jehoshaphat, Naboth, Gehazi, Sennacherib, Manasseh, Zedekiah, Baruch, Joel, Nahum, Obadiah, Habakkuk, Zephaniah, Simeon, Anna, Herodias, Martha's wider circle, Tabitha, Onesimus, Philemon, Ananias, Gallio, Eutychus, Tychicus

## 2.12.0 — Saved maps you can trust
- [x] Save Map downloads style, tile directory, icons, sprites, fonts and tiles (labels no longer missing offline)
- [x] Progress counts pieces actually stored; verification re-reads a sample before claiming "Saved"
- [x] Explicit states: Preparing / Downloading / Finishing / Verifying / Saved Offline / Download failed · Retry
- [x] Per-area saved records in IndexedDB, survive reload and restart; Saved maps panel with size, date and Remove
- [ ] Confirm saved-map rendering with no network in the installed iOS PWA (map workers may bypass the service worker)

## 2.14.0 UX audit pass
- [x] First-run welcome card; Read link back to the reader from content sections; single header line on small phones; removed duplicate map link on entity pages
- [ ] "In this chapter" places/people strip under chapter headings
- [ ] Move share/highlight/settings/tips onto the shared sheet + dismissible layer
- [ ] Replace one-off spinners with the shared skeleton/status message
- [ ] Grouped search results (Verses / People / Places) and persisted filters
- [ ] "Continue reading John 4" notice on return visits

## SEO Phase 2
- [x] Language addresses (/yo/, /fr/ ...) with hreflang, translated titles, html lang, 301 from ?lang=, language sitemaps
- [x] 404 for unknown names, journeys.xml, journey page H1/text/WebPage JSON-LD, lighter /maps HTML
- [ ] Per-page share images (low)
- [x] Per-leg journey pages, family tree pages (Adam, Abraham, Joseph — only existing trees)

## Journeys flagship experience
- [x] Separate canonical Journeys discovery from the place-focused map explorer
- [x] Add four validated journeys for eleven total
- [x] Add featured and categorized journey discovery
- [x] Enrich synchronized stop storytelling and long-route disclosure
- [x] Add journey search, Connections links, SEO, and tests
- [x] Verify responsive, offline, reader-return, and legacy-link behavior
