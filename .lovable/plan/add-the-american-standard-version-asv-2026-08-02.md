# Add the American Standard Version (ASV)

Extend the existing version switcher (WEB, KJV) with the ASV (1901), a public-domain translation carried by both the chapter text source and the search index.

## Note on the Revised Version

The 1885 English Revised Version is not offered by either our chapter-text provider or our search provider, so it cannot be added without sourcing and hosting the full text ourselves. Skipping it for now, as agreed — ASV (the 1901 American revision of the RV, from the same revision committee) is the closest available equivalent.

## What the reader sees

- The version menu in the reader header lists three options: WEB, KJV, ASV.
- Picking ASV re-renders the current chapter in that text immediately; the choice persists across chapters and sessions like the others.
- The caption and screen-reader label under the text read "American Standard Version".
- Search runs against the ASV index when ASV is active, and results are badged accordingly.
- Offline saving and reading are already version-scoped, so ASV chapters store and read back under their own keys.

## Technical changes

- `src/lib/translations.ts`: add `"asv"` to `TranslationId` and a `TRANSLATIONS` entry — label `ASV`, name `American Standard Version`, `apiCode: "asv"`, `searchCode: "ASV"`, blurb noting the 1901 public-domain text.
- `src/lib/chapter.functions.ts` and `src/lib/search.functions.ts`: widen the Zod `z.enum(["web","kjv"])` validators to include `"asv"` (derived from the translations list so future additions stay in sync).
- No other changes needed: chapter caching, the offline store, download, the header menu, and the search bar all already read from `TRANSLATIONS` and key by translation id.

## Verification

Load a chapter in ASV, switch between all three versions, run a search while ASV is active, and confirm an ASV chapter saves and reloads offline.
