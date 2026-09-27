# Codebase health pass: bundle size, resilience, structure

Seven improvements, grouped so each can be verified independently.

## 1. Split the two oversized components

**Reader chrome (635 lines)** becomes:
- `ReaderHeader.tsx` — title cluster, search, what's-new, settings trigger
- `ReaderSidebar.tsx` — book/chapter navigation
- `WhatsNewBanner.tsx` — the versioned release-notes banner
- `ReaderChrome.tsx` stays as the layout shell that composes them (and keeps exporting `ChapterPager` so existing imports keep working)

**Push toggle (438 lines)** becomes:
- `usePushState.ts` — a hook owning the permission / service-worker / subscription state machine and all actions
- `PushToggle.tsx` — presentational card that renders state + actions only

No behaviour changes; pure extraction.

## 2. Bundle: the two big static data files

Current state, confirmed by reading the imports:
- `threads/data.ts` (1,916 lines) reaches the reader chunk through `ChapterReader` → `threads/graph` → `nodesInChapter`, only to render a small "N threads run through this chapter" strip.
- `entries.ts` (1,314 lines) reaches the reader chunk through `Verse` → `atlas/match` → `annotateVerse`, which is genuinely needed to make words tappable inline.

Actions:
- Move the chapter-threads strip into a lazily imported component (`React.lazy` behind `Suspense`), so `threads/data.ts` loads only when a chapter actually has threads — and never on first paint. The connections routes keep importing it directly.
- Keep `entries.ts` in the reader path (inline annotation needs it synchronously), but trim what ships: the panel-only fields (long prose, artifact context) move to a separate module imported by `AtlasPanel`, leaving the reader with just the match index (id, labels, aliases, kind). This is the largest realistic win.
- Verify with a production build chunk report before/after and report actual KB deltas.

## 3. Prune unused shadcn/ui components

Scan every `src/components/ui/*` file for real imports and delete the unused ones plus their now-orphaned Radix / helper packages (`chart.tsx` + `recharts` is already confirmed unused — nothing imports it). Same for carousel, menubar, otp, day-picker/calendar, resizable, and any others the scan proves unreferenced. Only files with zero references are removed.

## 4. Error and loading granularity below the root

- `AtlasPanel`, the connections graph, artifact viewer and lexicon card each get their own error boundary with a small inline "couldn't load this panel" retry, so a failure never reaches the root error page.
- Each async panel gets a local `Suspense` skeleton instead of relying on the reader-level fallback.
- Routes missing them (`/`, `/connections`, `/connections/$node`, `/highlights`, `/whats-new`) get `errorComponent` and, where they load data, `pendingComponent`.

## 5. Structured data

`__root`, `/connections`, `/connections/$node` and `/{book}/{chapter}` already emit JSON-LD. Add:
- `BreadcrumbList` on chapter and connection-node routes (Home → Book → Chapter)
- `Book` + `Chapter`-style `CreativeWork` markup on the chapter route, replacing the current generic block
- `Article` on `/whats-new`, `CollectionPage` on `/highlights`

## 6. recharts

Confirmed not imported anywhere, including the admin dashboard — it is removed with the `chart.tsx` prune in step 3, so it cannot land in any chunk.

## 7. Monitoring and alerting

Building on the existing `ops_metrics` telemetry:
- Add `/api/public/health` returning database reachability, last push-cron run age, and recent error rate as JSON with a non-200 status when unhealthy — suitable for any external uptime checker.
- Record every daily-push cron run (started / sent / failed counts) into `ops_metrics` so a silent cron failure becomes visible.
- Add a "Cron & uptime" section to the admin dashboard that flags: no cron run in the last 26 hours, error rate above threshold, or push send failures.
- Alerts are surfaced in-app on that dashboard; if you want email/webhook alerts too, say so and I'll wire the delivery.

## Technical notes

- Lazy chunking uses `React.lazy` + `Suspense`, consistent with TanStack Start's automatic route splitting; no route files export their components.
- The health endpoint lives under `src/routes/api/public/` and returns no user data.
- Package removals are verified against a full repo reference scan before deletion.
