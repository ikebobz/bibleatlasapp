# Interactive Maps: /maps hub, journey pages, reader overlay links

Add a dedicated maps section to Bible Atlas without touching existing reader, atlas panel, threads, push, or highlight behaviour.

## 1. Journey data layer

New `src/lib/atlas/journeys.ts` holding seven journeys, each with: id, title, one-line summary, SEO description, era/timeline, and ordered stops. Every stop carries a place id, label, short note, Scripture reference (linked to the existing `/book/chapter/verse` routes), and optional event/church/letter detail.

Journeys: `abraham`, `paul` (four sub-routes: first, second, third, to Rome), `jerusalem`, `exodus`, `jesus`, `joshua`, `jonah`.

Missing coordinates get added to `PLACES` in `src/lib/atlas/geo.ts` (Moriah, Succoth, Rephidim, Kadesh-Barnea, Ai, Gilgal, Hazor, Tarshish, Myra, Malta, Puteoli, etc.). Distances and totals reuse the existing `haversineKm` / `routeDistanceKm` helpers; estimated travel time is derived from distance at a stated walking/sailing pace, labelled as an estimate.

## 2. Map player upgrades

`AtlasMap` keeps its current API and behaviour; it gains optional next/previous stop controls and a clickable-stop mode used only when the new props are passed. Clicking a stop pauses the animation and snaps progress to that stop. Existing panel maps render exactly as today.

## 3. Routes

- `/maps` — hero explaining Bible Atlas interactive maps, then a responsive card grid for the seven experiences with a small static SVG preview (rendered from the same projection), short description, and "Explore Journey" CTA. Internal links to the relevant Bible chapters (Genesis 12, Exodus 12, Joshua 6, Jonah 1, Matthew 4, Acts 13).
- `/maps/$journey` — full-width immersive map with play/pause/next/prev/scrub, stop list, per-leg and total distance, estimated travel time, timeline, and a Scripture link per stop. Paul's page adds a journey selector (first / second / third / to Rome) via a search param so each is shareable.
- Unknown journey ids render the existing not-found treatment.

## 4. Reader integration

In the atlas overlay (`AtlasPanel`), entries whose kind is `journey`/`place`/`person` and that map to a journey get an "Explore Interactive Map" button. It navigates to `/maps/<journey>` carrying the current book/chapter/verse in a `from` search param; the journey page shows a "Back to <Book Chapter:Verse>" control that returns to the exact verse using the existing verse-focus deep link. Closing the overlay itself keeps working as it does now (no scroll position change).

## 5. SEO

- Per-route `head()` on `/maps` and `/maps/$journey`: title under 60 chars with the short "Bible Atlas" suffix, meta description, og:title/og:description/og:type, self-referencing canonical and og:url. Single H1, semantic section headings.
- `sitemap[.]xml.ts` gains `/maps` and all journey URLs.
- `robots.txt` unchanged apart from confirming `/maps` is crawlable.

## Technical notes

- New files: `src/lib/atlas/journeys.ts`, `src/routes/maps.index.tsx`, `src/routes/maps.$journey.tsx`, `src/routes/maps.tsx` (layout `<Outlet />`), plus a small `JourneyStops` component.
- Edited: `src/lib/atlas/geo.ts` (extra places), `src/components/atlas/AtlasMap.tsx` (optional controls, additive props), `src/components/atlas/AtlasPanel.tsx` (CTA button), `src/routes/sitemap[.]xml.ts`.
- Journey data is a static module, imported directly on the maps routes so it does not enter the reader bundle path beyond the small id lookup used for the CTA.
- Tests: a Vitest case asserting each journey's stops resolve to known places and distances are non-zero.
