# Landing page: social previews, screenshot carousel, FAQ data

Three upgrades to the `/about` landing page. Nothing else in the app changes.

## 1. Branded social preview for /about

- New image endpoint `/api/public/og/about` that renders a branded 1200x630 PNG using the same SVG-card + lazy WASM rasteriser approach already used for verse cards: Bible Atlas wordmark, the headline "Read the Bible with maps, people and places in view", and a short subline.
- Falls back to the existing static parchment card if rendering fails, so a share link can never unfurl blank.
- `/about` head() points `og:image`, `og:image:width/height`, `og:image:alt`, `twitter:image` and `twitter:card: summary_large_image` at the absolute URL `https://mybibleatlas.com/api/public/og/about`, alongside the existing title/description/og:url/canonical tags (those already self-reference correctly).

## 2. Responsive screenshot carousel with next-step annotations

- Replace the stacked "See it in action" figures with a swipeable carousel using the project's existing embla-based `@/components/ui/carousel`.
- Three slides, each a framed screenshot plus a numbered annotation that tells the Bible Text → Context story:
  1. Read the chapter — Scripture stays in view.
  2. Tap a highlighted name — the context panel opens beside the text.
  3. Follow it further — the journey map, timeline and connections.
- Mobile: one slide per view with swipe; tablet/desktop: peeking multi-slide layout with prev/next buttons and dot indicators.
- Keyboard accessible (arrow keys, focusable controls), captions kept as `<figcaption>`, alt text preserved, images stay lazy-loaded with width/height set.
- If an existing carousel component is not present in `src/components/ui`, add it via shadcn's carousel with embla-carousel-react.

## 3. FAQ structured data validation

- Keep one source of truth: the `FAQ` array already drives both the rendered accordion and the JSON-LD, so question and answer text match exactly.
- Verify all 7 entries render and all 7 appear in `mainEntity`; answer text in JSON-LD is plain text identical to the visible paragraph.
- Ensure answers are visible in the SSR HTML (native `<details>` content is present in the DOM even when collapsed) so crawlers see them.
- Validate the emitted JSON-LD by fetching the SSR HTML of `/about` and parsing the script block, checking `@type`, `mainEntity` count, and that every question string matches the rendered heading.

## Technical notes

- New: `src/lib/og/about-card.ts` (SVG composition), `src/routes/api/public/og/about.ts` (endpoint).
- Edited: `src/routes/about.tsx` (head image tags, carousel section).
- Reuses existing `/render/*` font and WASM assets; no new runtime dependencies beyond the carousel package if missing.
- Note: platforms cache previews, so the new card may take time to appear on already-shared links.
