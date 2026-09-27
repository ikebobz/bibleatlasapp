# Branded share previews for every verse

## What's broken today

Shared verse links point at `/api/public/og/verse`, which no longer renders anything — it just 302-redirects to `public/og/verse-card.jpg`. That file is a blank parchment texture with no logo, no app name, and no text, so previews look like an empty grey/beige rectangle. The metadata also declares `og:image:type: image/png` while a JPEG is served, and points scrapers at a redirect rather than a direct image, which some platforms (notably WhatsApp and Discord) handle inconsistently.

The dynamic renderer was removed earlier because its WASM was compiled at worker startup, which broke the published site. The fix is to bring rendering back, but initialise it lazily inside the request handler so cold starts stay cheap.

## What the user gets

Sharing `/john/3/16` (or any verse) unfurls a card that reads:

```text
+------------------------------------------------------+
|  [icon] BIBLE ATLAS                                  |
|                                                      |
|  John 3:16                                           |
|                                                      |
|  "For God so loved the world, that he gave his       |
|   only begotten Son..."                              |
|                                                      |
|  Explore this verse in context — bibleatlas.lovable.app |
+------------------------------------------------------+
```

- Parchment background reused from the existing card, deep-navy rule and serif reference in the app's existing type/colour language. Minimal, verse-first, brand clearly present.
- Chapter-only links (`/john/3`) get the same card with the chapter reference and a short chapter line instead of verse text.
- Long verses and ranges are fitted on word boundaries with the existing `share-meta.ts` helpers and shrink one type step before ellipsing, so text never overflows.
- If anything at all fails, the card falls back to a newly generated **branded** default (logo + "Bible Atlas" + tagline on parchment) — never the blank texture.

## How it's built

**Rendering** — `src/routes/api/public/og/verse.ts` becomes a real image endpoint:
- Layout is composed as an SVG string by a new `src/lib/og/verse-card.ts` (pure string building, no layout engine, no satori). It embeds the parchment background and app mark as base64 data URIs and lays out the reference, wrapped verse text and footer at fixed coordinates with a measured character-width estimate for line breaking.
- Rasterised to PNG with `@resvg/resvg-wasm`, initialised **inside** the handler behind a module-level promise cache (`let ready: Promise<void> | null`), with the `.wasm` inlined at build time. Nothing WASM-related runs at module scope, so worker startup is unaffected.
- One embedded serif WOFF subset (Latin) is loaded the same lazy way for text rendering.
- Response: `image/png`, `Cache-Control: public, max-age=31536000, immutable`, keyed by the query string.
- Every failure path (init error, render error, missing params) returns the branded static fallback bytes with `200`, not a redirect — so scrapers always get a real image at the advertised URL.

**Fallback asset** — generate a branded `public/og/default-card.jpg` (1200x630: app icon, "Bible Atlas" wordmark, tagline, parchment). The existing `verse-card.jpg` stays in place so older shared links keep resolving.

**Metadata** — `src/lib/reader-head.ts` keeps its current structure; corrections only:
- `og:image:type` set to `image/png` and actually served as PNG.
- `verseCardUrl` in `src/lib/share.ts` gains `book`, `chapter`, `verse` and `t` params so the endpoint can re-fetch verse text server-side when `text` is absent (e.g. a crawler hitting a chapter URL).
- Root-level `og:image`/`twitter:image` in `__root.tsx` switch from the external Google-storage URL to the new branded default on our own domain.
- Titles/descriptions already match the requested shape (`John 3:16 — Bible Atlas`, verse text as description) and stay as-is.

Sharing, deep links, `ShareSheet`, install prompt, analytics: untouched.

## Validation

- Fetch the endpoint for Genesis 1:1, Psalm 23:1, John 3:16, Romans 8:28, Matthew 5:3 plus a deliberately long verse (Esther 8:9) and visually check each rendered PNG for correct reference, readable text and no overflow.
- Run a production build and hit the built worker to confirm cold-start startup budget is fine (the failure mode that broke the site last time).
- Confirm `curl -I` on the image URL returns `200 image/png`, and that each verse page's `og:image` resolves without a redirect.
- Existing tests (`reader-head.test.ts`, `share-meta.test.ts`) updated and green.

## Risk note

If the WASM rasteriser again proves too heavy for the worker's startup budget in the production build check, I'll stop and switch to plan B — a small set of pre-rendered branded cards plus text-free-but-branded default — rather than ship anything that can 500 the site.
