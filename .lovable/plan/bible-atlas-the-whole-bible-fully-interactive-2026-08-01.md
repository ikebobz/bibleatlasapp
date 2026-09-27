# Bible Atlas — the whole Bible, fully interactive

Today the reader ships 7 books (Genesis, Exodus, the Gospels, Acts) with a hand-authored Atlas layer: ~entries for people/places/objects, a threads graph, SVG maps, 3D artifacts, measures and the original-languages layer. The goal now is all 66 books with that same depth everywhere.

Hand-authoring context for 31,000 verses isn't possible, so the model becomes: **curated data stays authoritative, and everything else is generated on demand by AI and saved to the database** — the first reader to open a passage pays a second or two, everyone after that gets it instantly and identically.

This ships in phases so you can review as it grows.

---

## Phase 1 — All 66 books readable and enriched

**Complete canon**
- Full book metadata for all 66 books (chapter counts, canonical numbering, testament, section: Torah, History, Wisdom, Prophets, Gospels, Epistles, Apocalyptic).
- Book/chapter navigation reorganised into collapsible canon sections with a book grid, so 66 books stay browsable on phone and desktop.
- Search extended across the full canon (currently limited to the 7 shipped books), including book/chapter reference jumps for every book.

**Context everywhere**
- A shared enrichment cache in the database so generated context is written once and reused by every reader, keyed by entity + verse reference. Curated entries always win when they exist.
- The verse annotator gains a canon-wide gazetteer and name index (places, people, peoples, tribes, kingdoms, empires, mountains, rivers, deserts, festivals, animals, objects, laws) so highlights appear in Job and Zephaniah as readily as in Genesis.
- Tapping anything still opens the side panel over the text — never a navigation away.

**Deliverable:** every chapter of every book reads with live, cached context panels.

---

## Phase 2 — Places and the modern world

- A place record for every biblical location: ancient name, modern country/city, present-day status, coordinates, historical background, archaeology, timeline of events there, nearby sites with distances, related passages, and the journeys that pass through it.
- Map component upgraded to full-canon coverage with the existing ancient/modern overlay toggle, route animation, and nearby-site rings.
- Dedicated location pages (e.g. Jericho) that pull all of the above together, reachable from the panel and from search.

---

## Phase 3 — Stories, timelines, characters

- **Story hubs** for the major narratives (Creation, Babel, Exodus, Red Sea, Conquest, David and Goliath, Carmel, Nineveh, the lions' den, Nativity, Sermon on the Mount, parables and miracles, Crucifixion, Resurrection, Pentecost, Paul's journeys, Revelation): summary, background, animated map, timeline, cast, places, related stories, OT/NT links, historical and theological significance, key lessons.
- **Master timeline**: patriarchs, judges, kings of Israel and Judah, prophets, empires, temples built and destroyed, exile and return, the life of Jesus, the early church — with a "what else was happening" band synced to whatever chapter is open.
- **Character profiles**: biography, timeline, family, places visited, relationships, appearances across Scripture, related prophecies and characters.

---

## Phase 4 — Genealogy and the knowledge graph

- Interactive family-tree explorer with zoom, pan, expand-on-demand, search and relationship pathfinding: Adam→Noah, Abraham→Jesus, kings of Judah, kings of Israel, priestly line, twelve tribes, house of David.
- The existing Threads graph grows into a canon-wide knowledge graph over people, places, events, themes, miracles, objects, kingdoms, prophecies and books, with plain-language explanations on every connection.
- Search results gain rich previews: maps, timelines, tree fragments and related content, grouped by type.

---

## Phase 5 — Reading companion and polish

- A companion rail that proactively suggests, for the chapter in view: maps, genealogies, historical notes, language insights, cross references, prophecies and fulfilments, related passages, archaeology.
- Performance pass: lazy-load maps, trees, timelines and media; prefetch adjacent chapters; cache warm content; verify smooth behaviour on mobile, tablet and desktop.

---

## Data quality

Every generated item is tied to explicit verse references, and the panel visually separates **Scripture** from **historical/scholarly commentary**, marking where interpretation is disputed or uncertain. Generated content is labelled as such. Nothing overwrites curated entries.

---

## Technical notes

- **Books/text**: extend `src/lib/bible.ts` to the full canon and the book-number map in `src/lib/search.server.ts`; text keeps coming from the public-domain WEB feed through `chapter.server.ts` with its existing cache.
- **Cache tables** (Lovable Cloud): `atlas_context` (kind, slug, reference key, JSON payload, model, created_at) plus `atlas_place`, `atlas_person`, `atlas_story` as they arrive in later phases. Public read via anon SELECT policies; writes only from server functions using the service role. Read/write goes through new `createServerFn` handlers — no edge functions.
- **Generation**: Gemini 2.5 Flash via the Lovable AI Gateway, reusing the structured-block contract already used by `ai.server.ts` and `purpose.server.ts`, extended with new block types (place, timeline band, genealogy, story hub).
- **Matching**: `src/lib/atlas/match.ts` moves from a hand-listed phrase array to a generated canon index with scope filters and stopword handling, kept as a build-time data module so verse rendering stays synchronous.
- **Rendering**: new block types added to `BlockView`; heavy views (map, tree, timeline, 3D) lazy-loaded behind suspense; graph and tree components stay client-only to avoid hydration mismatches.
- **SEO**: sitemap regenerates over the full canon plus place, story and character pages, each with its own head metadata.

## Scope note

Phase 1 is the large one and is what I'd build next on approval; later phases follow in order unless you want them resequenced.
