# Bible Atlas — Production Readiness Review

Scope note: this is a **TanStack Start (React 19 + Vite 7) app on Cloudflare Workers**, not Next.js. Next-specific items (Server Actions, next/image, Metadata API) do not apply; the equivalents reviewed are server functions, route `head()`, and Workbox. Findings below are based on files actually read this turn; anything not read is marked "not assessed".

## Executive summary

The product is unusually rich for its size (~21.7k lines of app code, full 66-book canon, atlas/threads/lexicon layers, PWA, push, share). Engineering discipline is visible in comments and in the way past incidents were fixed. The gaps are the classic ones for a fast-built app: **zero automated tests, no rate limiting on AI/public endpoints, an unbounded per-worker in-memory cache strategy, a shared-passcode admin gate, and heavy client bundles with no measured Core Web Vitals.**

| Area | Score |
| --- | --- |
| Overall engineering | 68 |
| Production readiness | 62 |
| Architecture | 70 |
| Security | 65 |
| Performance | 60 |
| Accessibility | 55 |
| Code quality | 72 |
| UX engineering | 80 |
| PWA readiness | 78 |
| AI integration | 58 |

Verdict: **ship-capable for tens of thousands of users, not ready for millions** until the Critical and High items land.

## Critical (fix before a large launch)

1. **AI endpoints have no rate limit or cost ceiling.** `ai.functions.ts`, `purpose.functions.ts`, `threads/ai.functions.ts`, `lexicon.functions.ts` are unauthenticated server functions calling Lovable AI per tap. Inputs are length-capped, call volume is not. A single scripted client can drain the workspace AI credits. *Impact: total feature outage + spend.* Fix: per-IP token bucket in Postgres (`ai_usage(ip_hash, minute, count)` with an atomic upsert) plus a global daily cap; return 429 with a friendly panel state.
2. **No automated tests at all.** No unit, integration, or e2e files exist. Every regression so far was caught by users in production (share button, what's-new, push toggle). *Impact: recurring production incidents.* Fix: Vitest for `share-meta`, `measures`, `release-notes`, `bible`, `translations`; Playwright smoke for read → tap word → panel, share sheet fallback, offline reload.
3. **`supabaseAdmin` imported at module scope in route files** (`api/public/push/subscribe.ts`, `send-daily.ts`). Route modules are client-reachable in this stack; only the `.server.ts` filename keeps it out of the browser bundle today. *Impact: one refactor away from leaking a service-role client path into the client graph and breaking the build or worse.* Fix: `await import("@/integrations/supabase/client.server")` inside each handler.
4. **In-memory caches are unbounded and per-isolate.** `chapter.server.ts` and `atlas/ai.server.ts` use a plain `Map` with no eviction; `lexicon.server.ts` correctly caps at 800. On Workers each isolate keeps its own copy and hit rates collapse at scale. *Impact: memory pressure, cold-start misses, avoidable upstream load.* Fix: bound every map (LRU, ~200 chapters) and promote chapter text to the shared `atlas_context`-style Postgres cache or Cache API.

## High priority

5. **`push_subscriptions` has RLS on with zero policies** — correct (deny-all, admin-only) but silently fragile; document it and add an explicit `service_role` grant test.
6. **Single point of failure: `bible-api.com`.** All Scripture reads proxy one free third-party API with no timeout, no retry, no fallback. Add `AbortSignal.timeout(5000)`, one retry, and a secondary source (`bolls.life`, already used for search) before failing.
7. **Admin gate is a shared passcode** (`ADMIN_PASSCODE`) with no attempt throttling or audit trail. Add attempt rate limiting and move to real auth + `user_roles` if more than one operator.
8. **No security headers / CSP.** No `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` anywhere. Add them in `src/server.ts` around the SSR response.
9. **Accessibility below WCAG 2.2 AA.** Verse component exposes one `aria-label`; overlay panels, the SVG map, the connection graph and the artifact viewer were not verified for focus trapping, escape handling, or text alternatives. The graph and map need a keyboard-reachable list equivalent. Colour contrast of the parchment palette is unverified.
10. **Duplicate/conflicting meta in `__root.tsx`** — `description`, `og:description`, `twitter:description` are each declared twice. Crawlers see the truncated second copy. Remove the duplicates.
11. **Analytics tables will grow unbounded** (`share_events`, `whats_new_events`; 51 and 40 rows today, 1 index each). At millions of users these become the hottest write path. Add a retention job (90 days) and an index on `(created_at)` / `(event, created_at)`.

## Medium priority

12. `ReaderChrome.tsx` (635 lines) and `PushToggle.tsx` (438) do too much — split chrome into header, sidebar, banner; split push into state machine hook + presentational card.
13. `entries.ts` (1.3k) and `threads/data.ts` (1.9k) ship as static client data. Verify they are code-split per route; if imported by the reader, move behind a lazy import — likely the largest single bundle win.
14. Full shadcn/ui set is installed (30+ Radix packages, carousel, chart, sidebar, menubar, otp, day-picker, resizable). Several are unused; prune to cut install and build time.
15. No loading/error boundary granularity below the root — a failing atlas panel can bubble to the root error page. Add route-level `errorComponent` and Suspense fallbacks per panel.
16. No structured data (JSON-LD) despite content that suits `Book`/`Article`/`BreadcrumbList`.
17. `recharts` on the admin route only — confirm it is not in the main chunk.
18. No monitoring beyond `console.error` and the Lovable error reporter; no uptime check, no alert on push-cron failure.

## Low priority

19. Naming drift between `*.functions.ts`, `*.server.ts`, `*.browser.ts` is consistent — keep it; document in `AGENTS.md`.
20. `sideEffects: false` with CSS imports can over-prune in future bundler versions; pin the exception.
21. Service-worker version string is manual (`share-handoff-v2`) while the shell revision is a build timestamp — unify on the build id.

## Scalability assessment

- **100k users:** fine as-is, assuming AI rate limiting lands (AI credits, not compute, are the binding constraint).
- **1M users:** requires shared chapter caching (Postgres or Cache API), a second Scripture source, retention on analytics, and CDN cache headers on chapter routes.
- **10M users:** push fan-out becomes the bottleneck — the 15-minute cron loops rows in one worker invocation; needs batching/queue. Scripture text should be served from an owned store rather than a third-party API. Analytics should be append-only to an OLAP sink, not the transactional DB.

Single points of failure today: `bible-api.com`, the single Cloudflare worker bundle (a startup-budget regression takes the whole site down — this already happened once with the WASM OG renderer), and one Supabase instance.

## Positive findings

- Clean server/client boundary discipline and genuinely useful "why" comments on past incidents.
- Zod validation on every public endpoint read.
- RLS enabled on all five public tables; the share-events insert policy validates values, not just `true`.
- Cron endpoint requires a shared secret; admin passcode uses hashed constant-time compare and an httpOnly cookie.
- Workbox config is thoughtful: NetworkFirst navigations, per-build shell revision, `/api` and `/_serverFn` denylisted.
- Share handoff has a layered fallback chain that survives iOS Safari and Android webviews.

## Not assessed

Colour contrast values, real Core Web Vitals (no field or lab data collected), bundle composition (no build analysis run this turn), Supabase index quality beyond counts, `AtlasMap`/`ConnectionGraph`/`Artifact3D` internals, backup and disaster-recovery configuration, and CI/CD pipeline (no workflow files present).

## Proposed execution order

1. AI rate limiting + global spend cap.
2. Vitest + Playwright smoke suite and a CI workflow.
3. Handler-scoped `supabaseAdmin` imports; bounded caches; Scripture fallback + timeout.
4. Security headers/CSP; admin gate throttling.
5. Accessibility pass on overlays, map, and graph; fix duplicate meta.
6. Bundle split for `entries.ts`/`threads/data.ts`; dependency prune; analytics retention.

Approve and I will start at step 1 and work down, one reviewable change per step.
