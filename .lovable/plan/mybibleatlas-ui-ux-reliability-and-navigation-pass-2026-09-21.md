# MyBibleAtlas UI/UX Reliability and Navigation Pass

## Audit findings

### P0 — broken state

1. **Closing a map place card clears the selected location.** `MapsExplorer` derives the selected place from the URL, and its close button calls `selectPlace(null)`. That removes `?place=...`; the explorer then reveals its default journey (`jesus`, first stop), whose first location is Nazareth. Both Mapbox camera logic and the offline atlas consequently reframe to Nazareth. This is a shared state-model problem, not a visual Mapbox glitch.

### P1 — significant friction

2. **Map return navigation only works for Bible passages.** Reader links preserve `?from=book/chapter/verse`, but links from place pages and other app sections do not carry a return context. Direct map and journey links therefore have no stable fallback.
3. **Floating UI uses incompatible dismissal systems.** Settings and translation use click scrims but not Escape or focus restoration; reader tips use duplicated mouse-only document listeners; map discovery and map layer controls lack consistent outside dismissal; mobile drawers and custom dialogs vary again.
4. **Primary controls are often below a comfortable mobile touch size.** Reader-header, panel-close, map, share, and audio controls commonly use 28–36px targets rather than approximately 44px.
5. **Navigation is fragmented outside the reader.** Major sections hand-build breadcrumbs or minimal headers, while Maps, Timeline, Concordance, People, Places, Connections, Highlights, and Install are buried inside Reading Settings. This makes sibling sections difficult to discover and creates avoidable dead ends.

### P2/P3 — report and defer unless required by a P0/P1 fix

- Search/filter state is generally local and resets after leaving a section.
- Install, update, and audio surfaces can compete for bottom-screen space on narrow phones.
- Minor card-radius, spacing, chip-state, loading, empty-state, and icon-label inconsistencies remain across secondary/admin surfaces.
- These will be documented in the final report rather than triggering a broad redesign in this pass.

## Implementation plan

### 1. Preserve map location and camera state

- Separate **selected location** from **details-card visibility** in `MapsExplorer`.
- Closing details will collapse only the card; it will not remove the `place` URL parameter, marker highlight, camera target, zoom, map style, or related context.
- Add a compact, accessible control to reopen the current location card.
- Selecting a new marker/search result will update the URL, reopen the same `MapPlaceCard`, and center the existing canonical map.
- Keep journey mode explicit so a bare place deep link never falls through to Jesus’ default Nazareth stop.
- Remove the fallback-atlas remount/reset path caused solely by closing a card while retaining its normal offline behavior.

### 2. Add intelligent map return navigation

- Extend the existing return-context model from Bible-only references to a small allowlisted set of internal origins: Bible passage, place/person detail, timeline, concordance/connections, and Maps landing.
- Preserve an explicit origin when entering Maps from those surfaces; never accept an arbitrary external redirect.
- Show one unobtrusive 44px map-native back control:
  - Bible origin → exact chapter/verse.
  - Place/person or other app origin → that exact internal page.
  - Journey opened from Maps → Maps landing.
  - Direct/deep-linked `/maps` → stable Bible-reading fallback without a history loop.
- Use TanStack links/navigation and preserve relevant search state; do not add another router or generic browser-back button everywhere.

### 3. Standardize dismissible overlays

- Create one reusable dismissible-layer foundation for non-modal popovers using pointer events, Escape handling, inside-interaction protection, trigger-focus restoration, and optional anchored-scroll dismissal.
- Apply it first to Settings, translation picker, map discovery, map layer controls, Concordance suggestions, highlight/share menus, lexicon tips, and measure tips.
- Keep true blocking surfaces on the existing accessible dialog foundation, adapting the search dialog, mobile books drawer, install guide, and Atlas panel only where needed for consistent outside dismissal, Escape, focus containment, and focus return.
- Ensure map pans, pin taps, sliders, forms, scrolling, and menu actions do not double-fire or dismiss unexpectedly.
- Permit only one peer floating menu at a time in shared header/map chrome where overlapping menus would be confusing.

### 4. Improve navigation cohesion without redesigning the brand

- Separate app exploration links from reading preferences so Maps, Timeline, Concordance, People, Places, Connections, Highlights, and Install are discoverable without opening Reading Settings.
- Introduce a compact shared app-navigation pattern for reader and content sections, reusing current typography, colors, icons, and TanStack routes.
- Retain lightweight breadcrumbs where useful, but avoid duplicating competing navigation bars.
- Keep the map full-screen and map-first; only the back/app navigation control joins its existing floating chrome.

### 5. Mobile and accessibility hardening

- Raise high-frequency icon controls and dismiss targets to approximately 44×44px while preserving compact visual icons.
- Check focus order, visible focus, accessible names, expanded/pressed states, dialog/menu roles, and focus return.
- Prevent horizontal overflow and collisions among map controls, cards, timeline, safe areas, audio bar, install/update notices, and mobile browser gestures.
- Keep reduced-motion behavior and all current offline/PWA behavior intact.

## Verification

- Add focused tests for the regression: Samaria → details open → close → Samaria remains selected, marked, URL-addressable, and camera-stable; repeat across representative city, region, mountain, and water locations including Jerusalem, Egypt, Mount Sinai, and the Sea of Galilee.
- Test Bible → location → map → back, place page → map → back, Maps → journey → back, and direct deep-link fallbacks without loops.
- Test outside pointer/touch, inside interaction, Escape, and focus restoration for Settings, translation, map discovery/layers, reader popovers, search, and mobile drawers.
- Run the existing type and test suites.
- Use Playwright at 320, 375, 390, 430, 820, and 1440 widths to verify map controls, card persistence, return navigation, overlays, touch targets, overflow, and representative reader/content flows.
- Preserve the single `MapsExplorer` + `MapboxAtlas` architecture, the SVG offline fallback, journeys, translations, reader state, deep links, caching, and existing API-call behavior.

## Final report

Provide concise sections for **Fixed**, **UX Improvements**, **Remaining Issues**, and the **five highest-impact recommended next improvements**, with P0–P3 severity retained for unresolved audit findings.
