# Connections — A Guided Thread Through Scripture

Redesign Connections around a tactile, guided story rather than opening on a dense network. Preserve the 80 authored moments, 111 connections, existing routes, walkthroughs, filters, search, and AI fallback.

## Audit findings

### P0
- The graph’s nodes are pointer-only, so keyboard and assistive-technology users cannot select or trace them.
- Reader entry links do not carry the originating chapter or verse, and “Back to reading” currently returns to the homepage rather than the passage.

### P1
- The first screen asks users to decode a full force-directed graph before showing why a connection matters.
- Mobile dedicates a short canvas to many tiny nodes while search, nine themes, Trace, and zoom controls compete for attention.
- Trace silently changes what tapping a node does; its two-step state is not visually clear.
- Selecting another node remounts and recalculates the graph, disrupting spatial continuity.

### P2
- Search lacks complete keyboard navigation and consistent outside-click/Escape dismissal.
- Theme, Trace, walkthrough, and graph controls appear together before users need them.
- Trace results are a compact breadcrumb; the explanation for each hop remains elsewhere.
- Filters and trace state are not shareable or restorable through the address.

## Chosen design direction

Use the selected **Tactile threaded journey** composition:

- Illuminated-manuscript palette: warm paper, near-black ink, restrained antique gold, and verdigris.
- Lora for editorial headings and Nunito Sans for interface/body text, loaded in the document head.
- A single-column, mobile-first story with a fine vertical thread, generous spacing, small entity-kind symbols, and explanations placed between connected moments.
- Theme colors become contextual accents, not nine competing colors across the whole screen.
- Short fades and a sequential thread-line reveal, disabled under reduced-motion preferences.

## Implementation

### 1. Meaning-first Connections home
- Replace the graph-first opening with a clear introduction: what Connections is, one featured authored connection, and a primary **Trace a connection** action.
- Present curated walkthroughs as compact editorial starting points with the first and final Scripture references visible.
- Keep theme discovery compact and reveal filters only when requested.
- Add a secondary **Explore the full graph** action; the network becomes an optional overview rather than the required entry point.

### 2. Guided two-step Trace builder
- Build a focused Trace flow with explicit **Start** and **Destination** steps.
- Use searchable, keyboard-operable entity selection with name, Scripture reference, entity kind, and Testament context.
- When Trace begins from a selected node or reader passage, prefill the starting point.
- Show clear progress, cancel/change actions, sensible empty/no-path states, and avoid exposing unrelated controls during selection.
- Keep existing BFS pathfinding and authored data; no new backend or relationship model.

### 3. Tactile Trace result
- Render the completed path as an ordered Scripture story.
- Each stop shows its entity kind, name, summary, primary reference, and a clear action to open the passage.
- Between stops, show the authored theme, direct/indirect status in plain language, connection label, explanation, and supporting references.
- Animate the thread and steps in sequence with restrained timing; show the final state immediately for reduced motion.
- Let users select a stop for its full connections, change either endpoint, start another trace, or open the optional graph with the same path highlighted.

### 4. Focused node experience
- Restyle node details to follow the same hierarchy: Scripture moment first, “why it matters” connections second, deeper exploration last.
- Replace heavy repeated cards with open editorial rows and restrained separators.
- Keep curated connections visually distinct from generated insights; generated material remains explicitly labelled and subordinate.
- Preserve theme filtering, walkthroughs, passage links, and node routes.

### 5. Optional graph overview
- Keep the custom SVG graph for users who want the overview, but place it in a dedicated, clearly labelled mode.
- Default to a focused neighborhood around the selected node or traced path instead of presenting all relationships at equal prominence.
- Add keyboard-operable nodes, visible focus states, descriptive labels, and a list alternative.
- Preserve pan, zoom, drag, theme fading, direct/indirect line styles, and traced-path highlighting.
- Stabilize graph state across node navigation so selecting details does not restart the full layout.

### 6. Reader context and navigation
- Add a validated `from` context to reader-to-Connections links from chapters, Atlas panels, and entity details.
- Provide a persistent, specific return action such as **Back to John 3:16**, preserving language-prefixed reader addresses where applicable.
- Direct entry remains safe: show **Back to reading** or the Connections home without creating browser-history loops.
- Ensure tapping a passage and returning preserves the user’s Trace endpoints and result.

### 7. Responsive and interaction behavior
- Mobile: one calm reading column, 44px minimum actions, no tiny graph as the default, and no conflict with page scrolling.
- Tablet/desktop: widen the threaded story and optionally pair it with a restrained contextual overview, without reverting to a dashboard.
- Apply the existing dismissible-layer pattern to search/selection surfaces for outside tap, Escape, focus return, and safe map/scroll gestures.
- Maintain light/dark themes using semantic tokens; add Connections-specific tokens in the global design system rather than hardcoded component colors.

## Technical details

- Refactor `ConnectionsExplorer` into explicit home, trace-builder, trace-result, node-detail, walkthrough, and graph-overview states using small focused components.
- Reuse `ThreadNode`, `ThreadEdge`, `neighbours`, `tracePath`, `searchNodes`, `ConnectionList`, and existing route metadata.
- Add small graph helpers only where needed for focused neighborhoods and ordered trace explanations.
- Store shareable state in validated Connections search parameters while keeping `/connections` and `/connections/<node>` compatible.
- Use the project’s existing Button and dismissal/focus patterns for controls.
- Preserve current static/offline data behavior and avoid any new network dependency.

## Verification

- Verify initial discovery, node selection, Trace start/destination selection, no-path handling, completed path, walkthroughs, theme filtering, graph overview, generated insight boundary, and return to passage.
- Test keyboard-only and screen-reader semantics for search, selectors, graph nodes, Trace results, and focus restoration.
- Test at 320, 390, 430, 820, and 1280px, plus dark mode, 200% text, reduced motion, and offline mode.
- Confirm reader language addresses, chapter navigation, Maps, People, Places, Journeys, Search, translation selection, and offline/PWA behavior remain intact.
- Add focused tests for path presentation, route/search state, reader-return parsing, and graph keyboard selection.
