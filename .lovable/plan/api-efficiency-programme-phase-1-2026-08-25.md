# API Efficiency Programme — Phase 1

Goal: keep external API usage comfortably under 100,000 requests/month against a hard 150,000 ceiling, without changing how the app feels.

## Current picture (verified)

External providers in use today:

| Feature | Provider | Caching today |
|---|---|---|
| Chapter text (KJV/WEB/ASV/…) | bible-api.com → bolls.life fallback | in-memory LRU (250) per worker isolate + durable `chapter_cache` table + full KJV in `bible_verses` |
| Chapter text (NIV, MSG) | API.Bible | in-memory only — **never persisted** (licence guard) |
| Search (KJV, WEB, Yoruba…) | bolls.life | 30 min in-memory map per isolate |
| Search (NIV, MSG) | API.Bible | same 30 min in-memory map |
| Audio chapters | API.Bible | 24h in-memory + inflight dedupe |
| Available Bibles list | API.Bible | 24h in-memory |
| Concordance, people, places, maps, timeline, threads | own database / local data | no external calls |

Biggest cost drivers, in order: **licensed chapter reads (NIV is the default translation)**, public-domain chapter reads on cold isolates, and search.

The core weakness is that every cache is *in-memory per Cloudflare isolate*. Isolates are short-lived and numerous, so the effective hit rate is far lower than it looks — the same chapter can be fetched dozens of times a day.

## Phase 1 scope

### 1. Default translation → KJV, NIV one tap away
Public-domain text is durably cacheable and offline-capable; licensed text is not. Making KJV the default removes the single largest source of API.Bible calls. NIV/MSG stay in the version picker and remain fully supported; a reader who picks NIV keeps it (stored preference), so this only changes the first-visit and crawler path.

### 2. Durable, translation-scoped chapter cache for licensed text
Add a transient cache for API.Bible chapters with a 24-hour TTL and automatic expiry — stored server-side only, never exported, never downloadable, never written to the device. Keys always include the translation (`niv:john:3`), so no cross-translation contamination is possible. A scheduled purge deletes expired rows so nothing is retained beyond the window.

### 3. Durable search cache
Move search results out of per-isolate memory into a shared cache table keyed on `translation + normalised query + limit`, with a 7-day TTL for public-domain sources and 24 hours for licensed ones. Query normalisation (lowercase, collapse whitespace, strip punctuation) means `Faith `, `faith` and `FAITH` share one entry.

### 4. Cross-isolate request deduplication
Every outbound provider call goes through one shared helper that: checks memory → checks the durable cache → joins any in-flight request for the same key → only then calls the provider. Chapter, search, audio and the Bibles catalogue all move onto it, so the reader, contextual panel and verse view asking for John 3 at once produce exactly one upstream request.

### 5. Result limits
Search fetches 120 rows upstream to show ~25. Reduce the upstream limit to what the UI renders, with "load more" fetching from the already-cached response rather than re-querying.

### 6. Rate limiting beyond AI
The existing Postgres quota limiter currently guards only AI features. Extend it to chapter, search and audio with per-visitor burst/daily ceilings and a global daily backstop, sized well below the monthly budget. It keeps failing open on database errors, but a runaway client or scraper can no longer drain the plan.

### 7. Monitoring and alerts
`ops_metrics` already records surface, outcome, cache hit/miss, source and duration for chapter loads. Extend that coverage to search, audio and the catalogue, and add a **Monthly API Budget** panel to `/admin/seo`-style admin surfaces showing: month-to-date external requests, split by feature and by provider, cache hit rate, error rate, and percentage of the 100,000 target consumed — with 50/70/80/90% threshold markers.

### 8. Behaviour under pressure
Already partly in place (host blocking on 429/5xx, total time budget, database fallback). Complete it: exponential backoff with jitter between retries, no retry at all on 4xx other than 429, and — when a quota ceiling or provider outage hits — serve the last cached copy and show a quiet "showing saved text" note rather than an error. Bible reading never breaks.

## Budget and capacity model (delivered as a report)

A written model with per-feature budgets and requests-per-active-user estimates at 1k / 5k / 10k / 25k / 50k MAU, both before and after these changes, naming the MAU level at which the current plan stops being sufficient and what to change next (edge caching, wider offline coverage, licensed-text pre-warming).

## New-feature discipline

A short `API-BUDGET.md` at the repo root: any feature that calls an external API must state expected request volume, cache strategy and TTL, deduplication key, fallback behaviour, and estimated monthly impact. Referenced from `AGENTS.md` so it is applied automatically.

## Technical notes

- New tables `api_cache` (generic key → payload, TTL, provider, feature) replacing ad-hoc per-feature tables where sensible, with RLS locked to service role and GRANTs to `service_role` only; readers reach it through server functions.
- New module `src/lib/api/gateway.server.ts`: the single outbound path — memory LRU → durable cache → inflight dedupe → provider fetch → record `ops_metrics` → write cache. Chapter, search, audio and catalogue adapters call only this.
- All keys are `provider:feature:translation:resource` so translation scoping is structural, not conventional.
- API keys stay server-side; no provider is called from the browser (already true, preserved).
- Existing behaviour, routes, offline KJV store and licence guards are untouched.

## Out of scope for Phase 1

Full monitoring dashboard polish, alerting delivery (email/push), and offline support for additional translations — planned as Phase 2 once the traffic numbers from the new metrics are visible.
