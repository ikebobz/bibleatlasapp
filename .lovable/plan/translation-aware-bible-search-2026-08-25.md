# Translation-aware Bible search

## Root cause (confirmed)

Search only ever queries bolls.life, using the selected translation's `searchCode`. Translations served by API.Bible (NIV, MSG, Yoruba, Igbo, and every dynamic `apibible:` version) have no `searchCode`, and neither do Darby, BBE and Almeida.

`searchTranslationFor()` in `src/lib/translations.ts` is meant to fall back to a searchable version, but it falls back to `DEFAULT_TRANSLATION`, which is now **NIV** — itself unsearchable. So the URL becomes `https://bolls.life/v2/find/undefined?...`, which returns HTTP 200 with `{"results": []}`. Verified by direct request. That is exactly the "No verses found" the user sees, and because NIV is the default translation, most users hit it on their very first search.

Verified fix path: API.Bible's `/v1/bibles/{bibleId}/search` endpoint works for our licensed ids — NIV "love" returns 750 hits, Yoruba "ife" returns 6 hits with correct Yoruba text.

## What changes for the reader

- Searching in NIV, MSG, Yoruba, Igbo or any API.Bible catalogue version returns verses in that translation.
- Searching in a bolls-indexed version (KJV, WEB, ASV, YLT, BSB, Luther, Segond, Synodal, CUV, Vulgate, DRA, SV) keeps working exactly as today.
- Translations with no search source anywhere (Darby, BBE, Almeida) show "Text search isn't available for the Darby Translation — jump to a reference, or switch versions to search." instead of a misleading empty state.
- While a search runs the panel says "Searching NIV…"; failures say search is unavailable, distinct from a real zero-result answer.
- Switching translation clears stale results immediately.

## Technical plan

**Search provider resolution (`src/lib/translations.ts`)**
- Replace `searchTranslationFor` with `searchSourceFor(id)` returning a discriminated result: `{ kind: "bolls", code }`, `{ kind: "apibible", bibleId }`, or `{ kind: "none" }` — derived from the existing `searchCode` / `apiBibleId` fields, so translation ids stay a single source of truth and new versions are automatically routed.
- No fallback to another translation's text. Keep a thin back-compat export only if something else imports it.

**Server search (`src/lib/search.server.ts`)**
- `searchBible(query, translation)` dispatches on `searchSourceFor`:
  - bolls: current path, unchanged.
  - apibible: new `searchApiBible()` in `src/lib/apibible.server.ts` calling `/v1/bibles/{bibleId}/search?query=&limit=120&sort=canonical`, mapping the USFM `bookId` back to our internal book ids via the existing `USFM` map (reversed), filtering out books/chapters outside our canon, and stripping markup with the existing cleaner.
  - none: return `{ supported: false, hits: [] }`.
- Return shape becomes `{ translation, supported, hits }` so the UI can tell "unsupported" from "no matches". `search.functions.ts` validator already accepts dynamic ids; keep it.
- Add a small server-side in-memory cache keyed `${translationId}:${query}` (short TTL) plus in-flight de-duplication, mirroring the audio/chapter caches, to protect the API.Bible quota.

**Client (`src/components/reader/SearchBar.tsx`)**
- Query key already includes translation; extend it to the resolved source and handle the new response shape.
- Distinct states: searching (`Searching {name}…`), unsupported, error, empty, results. Remove the "…has no search index yet" cross-translation note since results are never from another version now.
- Offline path (`local-search.ts`) already filters by stored translation — unchanged, but it is skipped for display-only versions that are never stored, which then report "not available offline".

**Concordance**
- `bible_verses` is a KJV-only index; leave it KJV-only but label it explicitly in `ConcordanceSearch` and on the concordance pages ("Concordance statistics are based on the King James Version"), so KJV text is never silently shown as the selected translation. Entity pages (`people`/`places`) get the same note.

**Analytics**
- Extend the existing event helper to log `bible_search` with `translation`, `query` length/term, `results`, and `outcome` (`ok` | `unsupported` | `error`), fired once per settled search.

**Tests**
- Vitest unit tests for `searchSourceFor` covering KJV/bolls, NIV/Yoruba/Igbo/dynamic apibible, and unsupported versions, plus API.Bible response mapping (USFM → book id, out-of-canon filtering) against a recorded fixture.
- A Playwright script under `e2e/` driving the search dialog: search in KJV, switch to NIV and re-search, confirm results change and no stale KJV rows persist, and check an unsupported version shows the explanatory message.

## Not supported after this change

Darby, Bible in Basic English and Almeida have no upstream text-search index (bolls has no code for them and they are not API.Bible texts). They will state this clearly rather than returning empty results.
