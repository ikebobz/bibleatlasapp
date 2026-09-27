# Reader context cues

## Goal
Make richer linked words easy to recognize without interrupting Scripture reading or implying every reference has a map, archaeological evidence, or a 3D model.

## Changes
1. Add tiny, restrained cues beside eligible words in the Bible text: a pin for a location with actual map coordinates, and an object/model cue only for an entry with a working 3D model. Keep existing link colors and underlines for ordinary contextual links and cross-references. If a word has more than one capability, show only the most useful cue to avoid clutter.
2. Derive cue eligibility from the existing map catalogue and Atlas entries rather than from broad categories such as “place” or “object.” Keep this information in the lightweight reader index so opening a chapter does not load the full map or 3D content. Give archaeological context its own cue only where the existing content actually documents it; do not suggest certainty where location/evidence is disputed.
3. Give each linked word a descriptive accessible name stating what opens (for example, “Samaria — open map and context” or “Ark of the Covenant — view 3D model”), while keeping decorative glyphs hidden from screen readers. Preserve word tap targets, text selection, translation switching, quiet mode, original-language interaction, and the existing Atlas panel behavior.
4. Check examples with and without map coordinates and 3D models, across phone and desktop widths, light/dark and quiet mode. Add focused regression coverage for capability classification so future entries do not receive misleading cues.

## Technical notes
- Extend the generated lightweight Atlas match index and its generator with capability flags sourced from actual blocks and map records; handle gazetteer-only matches through a lightweight coordinate-backed lookup where appropriate.
- Render inline, non-breaking micro-icons in the existing `Verse` links using semantic theme colors; do not add a second map, new content claims, or change navigation.
