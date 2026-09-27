# Bible Atlas 2.10.0 — clarity, accessibility, and mobile polish

## Goal

Complete the five highest-impact UX improvements from the prior audit and add a clear journey-map legend, without changing the established reader, canonical Mapbox map, offline fallback, routing, translations, audio behavior, or visual identity.

## Verified current state

- Modal behavior is mixed: the notification diagnostics already use the accessible dialog primitive, while search, install guidance, the mobile book drawer, and reader context panels use custom fixed overlays with Escape handling but no complete focus trap.
- Anchored menus now dismiss outside and restore focus through the shared dismissal hook; these should remain lightweight popovers rather than being converted into modal dialogs.
- Audio publishes its measured height through `--audio-bar-h`, and update/install/offline prompts offset themselves above it. However, install and offline coordination relies on a one-time page query, while update availability is managed separately, so prompts can still compete or appear in an inconsistent order.
- Secondary-page states are implemented independently. Some pages have good empty/error copy, while dynamic areas use differing layouts, status semantics, retry behavior, and loading treatment.
- People and Places index cards and entity verse cards are spacious on narrow screens, reducing scan density.
- Many high-frequency controls were enlarged in the last pass, but lower-frequency actions still include sub-44px targets and dynamic changes without consistent live announcements.
- Journey data already exposes walking/maritime modes and verified/approximate/schematic accuracy. Map routes visually distinguish travelled versus upcoming sections and solid versus dashed travel, but there is no legend explaining these lines, markers, or accuracy terms.

## Implementation

### 1. Accessible modal foundation

- Keep anchored settings, translation, Explore, share, highlight, and map menus on the existing dismissible-popover behavior.
- Move true blocking overlays to the existing accessible dialog primitive so focus is trapped, Escape closes, focus returns to the opener, background content is inert, and screen-reader titles/descriptions are connected.
- Apply this to Bible search, install guidance, and the mobile book navigator.
- Treat the reader context panel responsively: modal bottom sheet on phones, modeless complementary panel beside Scripture on desktop, preserving its stack/back behavior and reader position.
- Standardize close controls at a minimum 44×44px and preserve reduced-motion behavior.

### 2. One coordinated mobile prompt rail

- Introduce one small shared coordinator for the install, update, and offline-download prompts instead of DOM inspection between independent prompts.
- Show at most one promotional/system prompt at a time, with deterministic priority: a safe ready-to-apply update first, installation guidance second, offline-download invitation third.
- Continue suppressing updates while offline or while a Bible download is active; do not interrupt reading or cancel downloads.
- Keep every prompt above the measured audio player and safe-area inset, and publish the active prompt height so page/map controls can avoid it where needed.
- Preserve existing snooze, dismissal, analytics, install completion, service-worker, and download behavior.

### 3. Consistent loading, empty, error, and offline states

- Add a small shared state presentation family for inline loading, empty results, recoverable errors, and offline-unavailable content, using the existing tokens and plain-language tone.
- Apply it to dynamic secondary experiences: Concordance/trending and results, Connections details/search, Highlights, entity verse results, map passage loading, and reader AI/context panels.
- Give recoverable failures a consistent retry action; give empty searches a clear reset or next step; retain specialized offline wording where the distinction matters.
- Add polite live announcements for search results, retries, copied/saved confirmations, and download progress without creating noisy announcements.

### 4. More compact mobile entity browsing

- Tighten People and Places index cards on phones: smaller internal spacing, two-line summaries, restrained metadata, and consistent 8px-or-less card corners while retaining comfortable full-card tap targets.
- Tighten entity detail verse cards and related journey/timeline/connection rows on phones, preserving readable Scripture line height and desktop spacing.
- Refine the map place card’s mobile hierarchy so the title, certainty, primary actions, nearby places, and journeys scan quickly without hiding content.
- Keep all existing entity URLs, map return context, verse links, and structured data unchanged.

### 5. Lower-frequency accessibility pass

- Audit remaining icon-only actions for accessible names, decorative icons for hidden semantics, form controls for labels, and dynamic status text for appropriate live regions.
- Raise remaining important mobile controls to 44×44px, including audio secondary controls, filters, pagination, graph controls, and card actions.
- Ensure visible focus treatment is consistent, remove color-only status communication, and correct dialog/menu semantics where roles do not match behavior.
- Preserve keyboard access to map controls and prevent any focus work from intercepting map pan, zoom, pinch, or drag gestures.

### 6. Journey map legend

- Add one reusable legend overlay at the `MapsExplorer` level so the canonical Mapbox map and bundled offline atlas share the exact same explanation—no second map or duplicated legend logic.
- Add a compact, familiar “Legend” control near the existing map controls. On phones it opens a small dismissible sheet/popover; on larger screens it opens a compact map-native panel.
- Explain at a glance:
  - strong route color: journey completed so far;
  - muted route color: route ahead;
  - solid line: land/walking segment;
  - dashed line: maritime segment;
  - filled/current and unfilled stop markers;
  - selected-place marker;
  - “Well-attested”, “Approximate”, and “Schematic” accuracy labels with short, honest definitions.
- Build swatches from the existing semantic map tokens and actual route metadata so the legend always matches both themes and both map surfaces.
- Use a semantic list, accessible toggle state, outside-tap and Escape dismissal, focus return, 44×44px control, and responsive placement that does not cover journey cards, timeline controls, attribution, or map gestures.
- Do not add API calls, tile requests, or new route geometry.

### 7. Release 2.10.0

- Set the product version to `2.10.0`.
- Add a dated release entry titled around clearer, calmer exploration, covering accessible dialogs, coordinated mobile notices, consistent page states, compact entity browsing, and the journey legend.
- Ensure the existing What’s New indicator and update prompt recognize the release for both returning and new visitors.

## Technical details

- Reuse the existing dialog primitive for modal focus management rather than hand-rolling a focus trap.
- Extend the existing dismissible-layer pattern only for non-modal popovers.
- Keep the prompt coordinator client-safe and local; no database, API, service-worker protocol, or analytics schema changes are required.
- Keep map legend presentation outside `MapboxAtlas` and `AtlasMap`; consume existing journey segment properties and semantic map tokens.
- Add focused tests for prompt priority, dialog keyboard/focus behavior, shared state variants, compact entity rendering, legend content/dismissal, and version ordering.

## Verification

- Keyboard: Tab/Shift+Tab stay inside each modal; Escape closes; focus returns to the opener; anchored popovers still dismiss without trapping focus.
- Mobile prompts: test audio collapsed/expanded with update, install, offline invitation, active Bible download, offline mode, and safe-area insets; confirm only one prompt appears.
- Maps: verify the legend on walking, maritime, and mixed journeys; all three accuracy levels; selected places; Mapbox and offline atlas; light and dark themes.
- Responsive: verify 320, 375, 390, 430, 820, and 1440px with no overlaps or horizontal scrolling.
- Regression: verify Bible reading/navigation, translation selection, search, sharing, Samaria place persistence, reader→map→reader return, journey playback, saved maps, PWA update/install, and offline reading.
- Run focused tests, the complete test suite, type checking, and a final accessibility/browser pass with no new console errors.
