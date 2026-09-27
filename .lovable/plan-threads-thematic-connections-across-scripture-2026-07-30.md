# Threads — Thematic Connections Across Scripture

Add a connection layer on top of the existing reader and Atlas panels, so readers can see how a passage links to the rest of Scripture: Passover to the Last Supper, the binding of Isaac to the cross, the tabernacle to Hebrews, the bronze serpent to John 3, Melchizedek to Hebrews.

The reader stays the product. Connections surface from the passage the reader is already in, and the full graph is available as a dedicated exploration space.

## What gets added

### 1. A connections dataset

A hand-authored graph on top of the current Atlas entries:

- **Nodes** — a passage/event/person/symbol/teaching with a name, primary Scripture reference, testament, and a short summary.
- **Edges** — a typed link between two nodes with a theme (covenant, sacrifice, prophecy/fulfilment, priesthood, kingship, exodus/redemption, temple/dwelling, creation/new creation), a strength (direct — the New Testament names it; indirect — pattern or echo), and a 2–4 sentence explanation of *why* the link holds, with supporting references.

Launch content: roughly 60–80 nodes and 100+ edges built around the five flagship threads above plus the major Genesis material already authored, so every existing Atlas entry that has a thread joins in.

### 2. Connections inside the reading experience

- A **"Connections" block** appears in the Atlas context panel when the selected entity is part of the graph: the linked nodes grouped by theme, each with its explanation and a one-tap jump to the passage — the chapter stays mounted, as today.
- A quiet **thread indicator** at the head of a chapter that has connections ("4 threads run through this chapter"), opening the panel filtered to that chapter.

### 3. The graph view

A new route (`/connections`, and `/connections/<node>` for a focused node) with an interactive, zoomable network:

- Pan, zoom, and drag; force-directed layout that settles, with Old Testament and New Testament pulled to opposite sides so cross-testament threads read visually.
- Click a node to open a side panel with its Scripture reference, summary, and every connection explained — the same panel component the reader uses.
- **Theme filter** chips; unselected themes fade rather than disappear so context is kept.
- **Trace mode**: pick two nodes and the graph highlights the pathway between them, including indirect hops, with each step explained in order.
- Direct links drawn solid, indirect links dashed; edge colour follows theme.
- Search to jump to any node.
- Mobile: the same graph with pinch-zoom, and a list fallback grouped by theme for small screens.

### 4. Thread walkthroughs

Curated linear journeys through a single theme (e.g. "Sacrifice: Abel → Isaac → Passover → Day of Atonement → the cross"), presented as an ordered set of stops. Each stop shows the passage, the explanation, and a step into the reader. Reachable from the graph and from the connections panel.

### 5. AI fallback

When a reader opens a node or asks about a pair with no authored explanation, the existing Lovable AI Gateway path generates the connection explanation on demand, clearly labelled as generated and cached — the same pattern already used for Atlas context.

## Design

Same restrained parchment/ink system. The graph uses the existing theme accents: nodes as small typographic pills rather than plain circles, edges as thin curves, hover raising a node and dimming the rest. Motion short and physical — the layout settles, trace paths draw in sequence. No charting library; the graph is custom SVG + a small force simulation.

## Technical approach

- `src/lib/threads/graph.ts` — typed node/edge model, theme enum, adjacency helpers, and pathfinding (BFS over the edge list for trace mode).
- `src/lib/threads/data.ts` — authored nodes, edges, and walkthroughs; node ids reuse existing Atlas entry ids where they overlap so the panel can cross-link both ways.
- New `connections` block type added to the Atlas block model and rendered in `BlockView`, so it composes with existing panels.
- `src/components/threads/ConnectionGraph.tsx` — SVG canvas, custom force simulation in a `requestAnimationFrame` loop, pan/zoom via pointer events and a view transform, memoised so filtering does not restart the layout.
- `src/routes/connections.tsx` and `src/routes/connections.$node.tsx` — SSR-friendly routes with their own head metadata; selected node and active theme filters live in URL search params so any view is linkable.
- AI fallback extends the existing `ai.server.ts` structured-output function with a connection-explanation schema.
- No backend needed for launch: the graph is static typed data. Cloud stays reserved for the chapter/AI caches already in place.

## Delivery order

1. Graph model, authored data for the five flagship threads, pathfinding.
2. Connections block in the Atlas panel plus the chapter thread indicator.
3. The graph route: layout, zoom/pan, node panel, theme filters.
4. Trace mode and thread walkthroughs.
5. Broaden authored coverage across Genesis, Exodus, the Gospels and Acts; AI fallback, mobile fallback, metadata, polish.
