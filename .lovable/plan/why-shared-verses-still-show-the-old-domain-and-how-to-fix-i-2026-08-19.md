# Why shared verses still show the old domain — and how to fix it

## What I checked on the live site

- The page tags for `https://mybibleatlas.com/john/3/16` are already correct: `og:url`, `twitter:image` and `og:image` all point at mybibleatlas.com.
- The static fallback card served in production already reads **mybibleatlas.com** (verified by downloading and viewing the live image).
- Old `bibleatlas.lovable.app` verse links correctly redirect to mybibleatlas.com.

So nothing in the current build emits the old domain. Two real problems remain, and together they explain what people are seeing:

1. **Platforms are serving cached previews.** WhatsApp, iMessage, Facebook and X keep the card they scraped weeks ago, keyed by the image URL. Because the image URL never changed, they never re-fetch it — so the old-domain card keeps appearing.
2. **The live card renderer is failing.** Requesting the verse card in production returns the generic parchment fallback (a JPEG), not the verse card. Locally the same request renders the proper PNG with the reference and verse text. So even a fresh scrape gets the generic card instead of the branded verse card.

## The fix

### 1. Force every platform to re-scrape

Add a version marker to the generated card URL (for example `v=3`) in `verseCardUrl` and the about-card URL. New URL means every platform treats it as a new image and fetches the current, correct card. Existing shared links keep working; only the image URL inside the page changes.

### 2. Make the production renderer work again

Diagnose why the WASM rasteriser fails in the deployed worker while succeeding locally. The fonts and `resvg.wasm` are served correctly in production (verified), so the likely causes are the worker's startup/CPU budget on a cold request or the WASM instantiation path. Remedies, in order of preference:

- Instantiate the rasteriser from a streaming/compiled module rather than a fetched byte array, and reuse it per isolate.
- Trim the work done per request (single font buffer, smaller SVG) so a cold render fits the CPU budget.
- If it still cannot render inside the request, generate on first hit and cache the PNG so subsequent scrapes are instant.

Add a diagnostic line to the existing admin diagnostics page showing whether the card renderer succeeded or fell back, so this cannot silently regress.

### 3. Small correctness fix found along the way

The verse page currently emits **two** `<link rel="canonical">` tags (`/john/3` and `/john/3/16`). Keep only the leaf one.

## Validation

- Fetch the production card endpoint and confirm it returns a PNG containing the reference, verse text and mybibleatlas.com — not the generic fallback.
- Confirm the page's `og:image` carries the new version marker.
- Re-run the existing domain and share tests.
- Note: after publishing, already-shared messages may still show the old card until each platform re-scrapes; pasting the link into a platform's link-preview debugger forces an immediate refresh.
