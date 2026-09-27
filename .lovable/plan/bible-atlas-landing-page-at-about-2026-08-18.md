# Bible Atlas landing page at /about

A dedicated marketing page that explains what Bible Atlas is, shows it in action with real screenshots, sends visitors straight into Genesis with a guided first-run tip, and answers common questions with FAQ structured data. The reader stays exactly where it is at "/".

## What gets built

**1. Landing page at /about**

- Hero: "Bible Atlas" H1, one-line value proposition (read Scripture with maps, people, places and connections in view), and two buttons — primary "Start reading Genesis 1", secondary "Explore interactive maps".
- Value section: three or four short benefit blocks (interactive maps and journeys, people and place profiles, concordance search, offline KJV reading), each linking to the relevant part of the app.
- Screenshots: real captures of the reader with a context panel open, an animated journey map, and the connections graph — shown in framed product shots with captions and alt text.
- Secondary CTA band above the FAQ repeating "Start reading Genesis 1".
- Footer links to /maps, /timeline, /concordance, /connections.

**2. Calls-to-action into the reader with a first-run tip**

- CTAs link to `/genesis/1?tour=1`.
- The reader recognises `tour=1` and shows a small dismissible coach tip pointing at a highlighted reference in the text: "Tap any highlighted name or place to open its map, profile or timeline." Dismiss (or first tap) hides it and records it in local settings so it never re-appears.
- No change to normal reader behaviour when the parameter is absent.

**3. FAQ with structured data**

- An FAQ section with a section heading and one subheading per question (proper heading order, no skipped levels), using the existing accordion component.
- Questions cover: what Bible Atlas is, which translations are available, whether it works offline, whether it costs anything, where the maps and place data come from, and how the concordance works.
- FAQPage JSON-LD emitted from the route's `head()`, with answer text identical to the visible copy.

**4. SEO wiring**

- Route `head()`: title "Bible Atlas — Interactive Bible Maps, People & Places", matching description, og/twitter tags, self-referencing canonical and og:url at `https://mybibleatlas.com/about`.
- Add `/about` to the sitemap route.
- Link to /about from the settings menu so it is reachable in-app.
- Mark the SEO opportunity finding fixed afterwards.

## Technical notes

- New file `src/routes/about.tsx` (`createFileRoute("/about")`), following the head/JSON-LD pattern already used in `src/routes/maps.index.tsx`.
- Screenshots captured with Playwright against the local dev server at 1280px, framed with the product-shot script, stored in `src/assets/` and imported as ES6 image imports; lazy-loaded with width/height set to avoid layout shift.
- First-run tip: `validateSearch` adds an optional `tour` flag on `/$book/$chapter` (and `/`); state persisted through the existing reader settings module in `src/components/reader/settings`.
- Add the `/about` entry to `entries` in `src/routes/sitemap[.]xml.ts`.
- No changes to Scripture fetching, offline storage, sharing, or existing routes.
