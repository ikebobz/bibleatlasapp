# Bible Atlas — Reader-First Scripture App

The Bible text is the product. Atlas context appears as overlays on top of the passage the reader is already in — never as a separate destination.

## Phase 1 scope

- Genesis, complete: all 50 chapters, every verse, readable end to end.
- Deep Atlas coverage on the flagship chapters: Genesis 1 (creation), Genesis 3 (the Fall and the promised offspring), Genesis 12 (Abram, Ur, Haran, Canaan), Genesis 37 (Joseph).
- Architecture built so Exodus, Matthew, Mark, Luke, John, and Acts drop in later with no rework.

## The reading experience

The home screen is the reader — no landing page, no dashboard.

- Single-column typographic column of Scripture, generous measure, verse numbers as quiet superscripts.
- Chapter navigation: a slim left rail (book, chapter grid) that collapses on mobile, plus prev/next chapter at the passage foot and keyboard arrows.
- Reading position is persisted locally and restored on return.
- Reading controls: font size, line height, light/dark, and a "quiet mode" that dims all Atlas highlights for uninterrupted reading.

## How Atlas appears

Recognized entities inside the verse text — people, places, tribes, nations, journeys, events, objects, covenants, prophecies, miracles, concepts — render as subtly marked inline references (a soft underline, colored by category, never a loud link).

Selecting one opens a **context panel**: a right-hand side sheet on desktop, a bottom sheet on mobile. The passage stays mounted and visible behind it; the active verse is gently highlighted so the eye returns to it on close. Escape or tapping outside closes and returns to the exact scroll position. Panels stack as a breadcrumb trail (Ur → Abraham → Canaan) with a back control, so exploring never unmounts the chapter.

Panel content is composed of typed blocks, so each entity shows only what is meaningful:

- **Map** — stylized ancient-world map with the location pinned, and animated route playback with distance travelled.
- **Timeline** — placement in the biblical chronology, or a themed timeline (the seven days; Eden → Cross → New Creation).
- **Family tree** — for people, with clickable relatives.
- **Cross-references** — related passages, each a one-tap jump that opens inline rather than losing the chapter.
- **Diagram** — comparative visuals such as Adam and the "last Adam", or the order of creation.
- **Prose sections** — historical background, archaeology, significance, themes, connections to later Scripture.

Every block answers the same question: how does this help me understand the verse in front of me right now?

## Maps and visualizations

A hand-built SVG map of the ancient Near East and Mediterranean — coastline, rivers, named regions — in a restrained cartographic style. Cities are plotted on real coordinates projected into the SVG. Journeys animate along their path with a moving marker, stage labels, and a cumulative distance readout, with play/pause and scrub. Timelines, family trees, and diagrams are the same: custom SVG/CSS, animated, no charting library.

## Content model

Atlas entries are hand-authored data for the flagship chapters and every major Genesis person, place, and theme: rich, accurate, instant, offline. When a reader selects a marked term with no authored entry, an AI fallback generates the context panel on demand from the verse and surrounding passage, clearly labelled as AI-generated and cached so it is instant the second time.

## Design direction

Premium and quiet — Apple/Linear restraint with Notion's reading comfort. Warm paper-toned light theme and a deep neutral dark theme, one accent used sparingly for Atlas affordances, a serif for Scripture against a clean sans for interface chrome, generous whitespace, and motion that is short and physical (sheets that slide, routes that draw). No purple gradients, no default Inter-on-white.

## Technical approach

- **Text**: World English Bible (public domain) fetched per chapter from a free Bible API through a server function, normalized to a verse array, and cached in TanStack Query plus Lovable Cloud so repeat reads are instant and the API is hit once per chapter.
- **Routing**: `/` renders the reader at the last position; `/genesis/12` style routes give every chapter a shareable, SSR-friendly URL with its own metadata. Context panels are URL state (`?ref=ur`) so a panel is linkable and the back button closes it.
- **Annotation**: an entity index maps phrases to entries per book/chapter/verse; verse text is tokenized against that index at render time, so highlighting never mangles the Scripture text.
- **Data**: authored Atlas entries as typed data modules; Lovable Cloud stores cached chapters, cached AI panels, and reading position.
- **AI fallback**: a server function using the Lovable AI Gateway with a structured-output schema matching the panel block types.

## Delivery order

1. Design system, reader shell, chapter routing, Genesis text pipeline with caching.
2. Entity index, inline highlighting, context panel with stacking and scroll preservation.
3. SVG map with animated journeys; timeline, family tree, and diagram blocks.
4. Authored Atlas content for Genesis 1, 3, 12, 37 and major Genesis entities.
5. AI fallback with caching and labelling; reading settings, persistence, polish, metadata.
6. Then Exodus, the Gospels, and Acts on the same rails.
