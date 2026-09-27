# Lock the domain in with tests, a build guard, and a diagnostics view

Four pieces of work, all additive — no change to how the app behaves for readers.

## 1. Unit tests for generated links

New `src/lib/share.test.ts` (Vitest, already configured):

- `verseUrl`, `shareUrlFor`, `entryUrl`, `threadUrl`, `verseCardUrl` all produce origins equal to `https://mybibleatlas.com`.
- Path shape is right: `/john/3/16`, `/genesis/1` with `?v=`, `/connections/<node>`.
- Context survives: `t=<translation>` only for non-default versions, `ref=<entryId>`, and `s=share` always present.
- Every URL in `shareTargets()` (WhatsApp, Telegram, X, Facebook, LinkedIn, email, SMS) embeds the canonical link, so no channel leaks another host.
- A negative test asserts no generated string contains `lovable.app`.

New `src/components/reader/useVerseFocus.test.ts` (or an extension of the reader-head tests) asserts that a URL produced by `verseUrl` parses into the book/chapter/verse the reader focuses and highlights — i.e. the shared link opens with verse highlighting enabled, not just the right page.

Extend `src/lib/reader-head.test.ts` and `src/lib/structured-data.test.ts` with explicit canonical/og:url origin assertions.

## 2. Integration tests for legacy-host redirects

New `src/server.test.ts` exercising the exported `fetch` handler's redirect branch directly (no network, no build):

- `https://bibleatlas.lovable.app/john/3/16?t=kjv&s=share` → 301 to the same path and query on `mybibleatlas.com`.
- `https://www.mybibleatlas.com/maps/paul?leg=2` → 301, query preserved.
- `/genesis/1`, `/concordance/faith`, `/connections/<node>` all preserved verbatim, including hash.
- Non-redirect cases stay non-redirect: `mybibleatlas.com` itself, `localhost`, `id-preview--*.lovable.app`, `*-dev.lovable.app`, and any `/api/public/*` path (webhooks and cron must not be moved).

To keep this testable, the redirect helper in `src/server.ts` is exported (behaviour unchanged) so the test can call it without importing the SSR entry.

## 3. Build-time domain guard

New `scripts/check-domain.ts`, run as a `prebuild`/`predev`-style npm script (`bun run scripts/check-domain.ts`) and also wired into a test so CI catches it either way:

- Renders the sitemap entries, `robots.txt`, the canonical/og:url output of every route `head()` helper, and the structured-data builders, then asserts each absolute URL starts with `https://mybibleatlas.com`.
- Greps `src/` and `public/` for `lovable.app` and fails on any occurrence outside an explicit allowlist (the redirect's legacy-host list, preview-host guards in service-worker registration, and Lovable Cloud error/config strings).
- Exits non-zero with a per-file report, so the build fails loudly rather than shipping a wrong domain.

## 4. Environment diagnostics view

New admin-only route `src/routes/admin.diagnostics.tsx`, behind the same passcode/session gate as `/admin/devices`, `noindex`:

- Computed `SITE_URL`, `SITE_HOST`, and whether it came from `VITE_SITE_URL` or the built-in fallback.
- The request host actually serving the page, and whether that host would be redirected.
- Live examples: canonical URL for `/`, canonical + og:url for a sample verse, the sitemap base and first few entries, the OG card URL, and the resolved `robots.txt` sitemap line.
- A "redirect check" table showing each supported legacy host and where it lands.

A server function returns the server-side computed values so preview vs production differences are visible at a glance.

## Technical notes

- Tests run under the existing `bun run test` (Vitest, node environment); no new dependencies.
- `src/lib/site.ts` stays the single source of truth; nothing in this plan hardcodes the domain except the assertions themselves.
- No change to share text, channels, routing, reader behaviour, or the OG card renderer.
