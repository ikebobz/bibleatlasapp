# Fix remaining High and Medium SEO audit items

Items 5, 6 and 7 (languages, hreflang, translated titles) are already done. This covers the rest. Map layout, reader and navigation stay as they are; new text sits below the map.

## High

**#2 Journey pages thin, no H1** (`/maps/$journey`)
- Add a text section under the map: H1 ("Paul's Missionary Journeys — Map & Route"), the existing journey summary, and a numbered stop list. Each stop links to its place page and its Bible verse and shows the route distance.
- Everything is taken from existing journey data. Nothing new is written.

**#3 No page per journey leg**
- New pages at `/maps/paul/first`, `/maps/paul/second`, `/maps/paul/third` and `/maps/paul/rome`, plus the same pattern for every multi-leg journey.
- Each leg page opens the same map on that leg and has its own title (e.g. "Paul's First Missionary Journey Map — Acts 13–14"), description, canonical, H1 and stop list.
- Old `?leg=first` links 301 to the new address. `/maps` and the journey page link to every leg.

## Medium

**#4 Journey structured data**: add WebPage JSON-LD (with `about` Place items with coordinates, and `citation` verses) alongside BreadcrumbList on journey and leg pages.

**#8 Unknown people/places return 200**: names not in the name list now return a real 404 with noindex. Real but thin names keep their page with noindex, follow.

**#11 Sitemap lists noindex pages**: people and places sitemaps list only written (indexable) profiles. Add a `journeys.xml` with every journey and leg page (this closes low item #12 as well).

**#13 No family tree pages**
- `/people/$slug/family-tree` only for people whose family tree already exists in the reader panel data. It shows a text family tree (parents, spouse, children, with verse references and links), an H1 ("Abraham's Family Tree in the Bible") and Person JSON-LD with parent/children/spouse.
- People without data get a 404. Nothing is invented.
- Linked from the person page and included in the sitemap.

**#21 Licensed text**: confirm each licensed version stays reachable only via `?t=`, with noindex and a canonical pointing to the open page. Check that the attribution shown matches each licence (Biblica CC BY-SA, api.bible). Fix any missing lines.

**#23 Heavy `/maps` page (247 KB HTML)**: measure what is embedded in the page, stop sending the full place catalogue in the first response (load it on the device when the map opens), and re-measure. The target is under 120 KB.

## Verify
- Raw HTML of `/maps/paul`, `/maps/paul/first` and `/people/abraham/family-tree` shows H1, stop list or tree, canonical and JSON-LD.
- `/maps/paul?leg=first` returns 301. `/people/zzz-nope` returns 404.
- `journeys.xml` lists legs, and the people sitemap equals the written profiles.
- Existing tests plus new ones pass. Browser check at phone and desktop confirms the maps still work.
- Bump the version and add a release note.

## Technical notes
- New route files: `maps.$journey.$leg.tsx` (reuses MapsExplorer with the leg preset) and `people.$slug.family-tree.tsx`. The `?leg=` redirect goes in the `maps.$journey` beforeLoad.
- The entity loaders `throw notFound()` when there is no gazetteer or curated match.
- The family data source is the atlas entry family-tree sections (`entries.ts`), matched to person slugs.
- `sitemap.ts` gets a journeys section and an `entity.published` filter.
