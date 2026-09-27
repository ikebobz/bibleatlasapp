# Move every user-facing link to mybibleatlas.com

Most SEO metadata already uses mybibleatlas.com, but shared links are still built from whatever domain the reader is open on (`window.location.origin`), so a verse shared from the Lovable domain sends the recipient there. This plan makes the production domain a single configured source of truth, cleans up the last hardcoded Lovable references, and keeps old links working.

## What changes for users

- Sharing a verse always produces `https://mybibleatlas.com/john/3/16` (plus the existing translation / context parameters), no matter which domain the sender is reading on.
- Recipients still land on the exact book, chapter and verse, with the current focus/highlight behaviour and branded preview card unchanged.
- Old `bibleatlas.lovable.app` links keep working and now redirect to the same page on mybibleatlas.com.
- Help text that currently tells iPhone/Android users to open "bibleatlas.lovable.app" now names the real site.

## Single source of truth

New `src/lib/site.ts`:

- `SITE_URL` resolved once from `VITE_SITE_URL` (falling back to `https://mybibleatlas.com`), so local dev and preview can override it without code edits.
- `canonicalUrl(path)` helper for canonical, og:url and structured-data URLs.
- `.env` gains `VITE_SITE_URL="https://mybibleatlas.com"`.

Then replace the per-file copies of the domain with imports from it:
`src/lib/share.ts`, `src/lib/reader-head.ts`, `src/lib/structured-data.ts`, `src/routes/sitemap[.]xml.ts`, `src/routes/__root.tsx`, `index.tsx`, `about.tsx`, `timeline.tsx`, `maps.index.tsx`, `maps.$journey.tsx`, `concordance.index.tsx`, `concordance.$term.tsx`, `connections.index.tsx`, `connections.$node.tsx`, `highlights.tsx`, `whats-new.tsx`.

## Share links

In `src/lib/share.ts`, `verseUrl`, `entryUrl`, `threadUrl` and `verseCardUrl` build on `SITE_URL` instead of `siteOrigin()`. Path shape, query parameters (`t`, `ref`, `s=share`), share text, channel targets (WhatsApp, X, Telegram, LinkedIn, Facebook, email, SMS) and native share payloads stay exactly as they are. Only the origin changes.

`src/routes/api/public/og/verse.ts` keeps using the *request* origin for fetching its font/WASM assets — that must stay same-origin so the branded card still renders on every host.

## Remaining Lovable references

Update the user-visible strings and defaults:

- `src/components/reader/IosPushHelp.tsx`, `src/components/reader/PushDiagnostics.tsx`
- `src/lib/push/diagnostics.ts`, `src/components/reader/usePushState.ts`
- `src/lib/push/vapid.server.ts` (default VAPID subject), `src/lib/push/daily.server.ts` (outbound user-agent)
- `src/lib/admin/reset.server.ts` fallback origin for reset/sign-in emails (request origin still preferred)

## Redirects and backwards compatibility

Add a host redirect in the server entry (`src/server.ts`): any request whose host is `bibleatlas.lovable.app` (or `www.mybibleatlas.com`) gets a 301 to the same path and query on `mybibleatlas.com`. Preview hosts (`id-preview--…`, `*-dev.lovable.app`), localhost and `/api/public/*` are excluded so previews, webhooks and cron keep working.

## SEO and PWA

- Sitemap, robots.txt and canonical tags already point at mybibleatlas.com; they get re-pointed at the shared constant so they can never drift. Combined with the 301, duplicate indexing is avoided.
- `public/manifest.webmanifest` uses relative `start_url`/`scope`/icons, which is correct for both domains — no change needed. Service worker and offline storage are origin-scoped and untouched; users who installed from the Lovable domain keep their offline data there.

## Validation

- Unit tests (`reader-head.test.ts`, `structured-data.test.ts`, `share-meta.test.ts`) run and updated where they assert origins.
- Load `/`, `/john/3/16`, `/genesis/1/1`, `/concordance/faith`, `/maps`, `/maps/abraham`, `/maps/paul` in a headless browser; confirm rendering, verse focus/highlight from a shared link, and canonical/og tags.
- Confirm `/api/public/og/verse` still returns a branded PNG (no grey placeholder).
- Grep for any leftover `lovable.app` occurrence and report what stays and why.
