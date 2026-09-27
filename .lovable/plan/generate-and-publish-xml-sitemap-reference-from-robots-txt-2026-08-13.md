# Generate and publish XML sitemap, reference from robots.txt

## Current state

The project already has both pieces in place:

- `src/routes/sitemap[.]xml.ts` — server route that generates `/sitemap.xml` dynamically, covering all public routes (home, maps, timeline, connections, whats-new, all journeys, all 66 books and their chapters, all thread nodes).
- `public/robots.txt` — already includes the `Sitemap: https://bibleatlas.lovable.app/sitemap.xml` directive and allows all major crawlers while disallowing `/admin/`, `/api/`, and `/highlights`.

## What this plan will do

1. **Audit the sitemap** — verify the route includes every public indexable route and excludes non-indexable routes (`/admin`, `/api`, `/highlights`, `/not-found`, `*`).
2. **Audit robots.txt** — confirm the sitemap URL is present and the allow/disallow rules match the current routes.
3. **Fix any gaps** — if a public route is missing or an internal route is included, update the sitemap entries.
4. **Publish** — deploy the site so the live `/sitemap.xml` and `/robots.txt` are served at the production URL and can be submitted to search engines.
5. **Smoke-test** — request the live `/sitemap.xml` and `/robots.txt` after publishing to confirm they are reachable and well-formed.

## Out of scope

- No new routes or pages will be created unless the audit reveals a missing public route.
- No search-engine submission will happen directly (the user can submit the sitemap in Search Console after publishing).
