# Dynamic API.Bible translations, merged and cached

Right now every licensed translation is hardcoded. I checked our API.Bible key against the live catalogue: it authorises 257 bibles. NIV (`78a9f61…`), The Message (`6f11a7d…`), Yoruba (`b8d1fea…`) and Igbo (`a36fc06…`) are all still valid — but **NKJV (`63097d2a0a2f7db3-01`) is not in the authorised list at all**, which is exactly the 404 being seen. Nothing else in our table is broken.

## What changes for the reader

- The version dropdown keeps every public-domain text it has today (KJV, WEB, ASV, BSB, YLT, Darby, BBE, DRA, Luther, Segond, Almeida, Statenvertaling, Synodal, CUV, Vulgate, Yoruba, Igbo) exactly as-is.
- On top of those, it shows the English + major-language bibles our key actually authorises (NIV, MSG, AMP, NLT, CEV, GNT, FBV, LSV, Geneva, RV 1885, and the non-English Biblica open editions), grouped by language as now.
- NKJV disappears from the list, so no more dead option.
- If the catalogue request fails or the key is missing, the dropdown silently falls back to the hardcoded list — never an empty or broken picker.

## Technical plan

**New route `src/routes/api/public/get-available-bibles.ts`**
- `GET` handler calls `https://api.scripture.api.bible/v1/bibles` with the `API_BIBLE_KEY` header (server-only, never shipped to the browser).
- Two caching layers so we cannot loop-drain the rate limit:
  1. Module-level memo via the existing `boundedCache` helper with a 24 h timestamp check — repeat calls inside one isolate never touch upstream.
  2. `Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800` on the response, so the CDN and the browser both hold it for a day.
- Maps each entry to our shape: `{ id: "apibible:<bibleId>", label: abbreviationLocal, name, language: language.name, apiBibleId, copyright, displayOnly: true }`. Filters out duplicate ids/abbreviations and the texts we already carry locally (WEB, ASV, DRA, KJV, Yoruba, Igbo) so nothing appears twice.
- On any upstream error returns `{ bibles: [] }` with a short cache window rather than a 5xx.

**Translation registry (`src/lib/translations.ts`)**
- Remove the `nkjv` entry (unauthorised → 404). NIV, MSG, Yoruba, Igbo stay untouched.
- Export a `dynamicTranslation()` helper that turns a catalogue row into a `Translation`, and make `getTranslation()` resolve `apibible:<id>` ids from a runtime registry that the fetched list populates.

**Validators and fetching**
- `chapter.functions.ts` and `search.functions.ts` currently use `z.enum(TRANSLATION_IDS)`. Widen to `z.union([z.enum(TRANSLATION_IDS), z.string().regex(/^apibible:[a-f0-9]{16}-\d{2}$/)])` so dynamic ids validate without opening the door to arbitrary input.
- `chapter.server.ts` routes any `apibible:` id straight to the existing `fromApiBible` adapter with the embedded bible id — no new adapter needed. Existing per-chapter cache keys already include the translation id.
- Dynamic entries are marked `displayOnly: true`, so all existing offline/download guards keep refusing to store them; search falls back to the default translation via the existing `searchTranslationFor()` path.

**Frontend merge (`src/components/reader/chrome/ReaderHeader.tsx`)**
- A `useQuery` (`staleTime`/`gcTime` 24 h, no refetch on focus or mount) hits the new route once and registers the results.
- Menu renders `translationsByLanguage()` over hardcoded ∪ fetched, hardcoded first within each language group. No loading spinner in the trigger — the hardcoded list renders immediately and the extras appear when they arrive.
- If a stored setting points at a dynamic id that is no longer authorised, `getTranslation()` falls back to KJV instead of 404-ing.

**Attribution**
- The `/about` translations block and the reader caption already render `copyright` when present; dynamic entries carry the catalogue's copyright string so the licence notice keeps showing.

## Verification

Load the route directly and confirm a 24 h cache header plus a non-empty list; hit it twice and confirm only one upstream call. In the reader: open the picker, confirm the public-domain list is intact and no NKJV; open a chapter in NIV, in one newly surfaced version, and in Yoruba; confirm offline save is refused for licensed ones and still works for KJV; confirm existing tests stay green.
