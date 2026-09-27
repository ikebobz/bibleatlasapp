# Yoruba and Igbo Bible translations

## Licensing check (done first, before any code)

Both languages are available through the same API.Bible account Bible Atlas already uses, and both are openly licensed — not "all rights reserved" like NIV/NKJV/MSG.

| Translation | Provider | Licence |
| --- | --- | --- |
| Biblica® Open Yoruba Contemporary Bible 2017 (BMYO) | Biblica, via API.Bible | Creative Commons BY-SA 4.0 |
| Biblica® Open Igbo Contemporary Bible 2020 (BIUO) | Biblica, via API.Bible | Creative Commons BY-SA 4.0 |

CC BY-SA 4.0 means: free use including commercial, redistribution and caching allowed, offline storage allowed, no permission fee. Conditions: display the copyright notice, keep the text unmodified, keep the Biblica® trademark intact, and name the licence. That is exactly the attribution Bible Atlas already renders for copyrighted texts, so nothing new is needed structurally — but these two must NOT be treated as "display-only" the way NIV/NKJV/MSG are.

No unverified sources are used. Yoruba and Igbo are not in the public-domain feeds (bible-api.com / bolls.life), so full-text search has no index for them.

## What the reader gets

- Two new entries in the translation picker, grouped under their own languages: "Yorùbá — Biblica® Open Yoruba Contemporary Bible" and "Igbo — Biblica® Open Igbo Contemporary Bible".
- Switching translation keeps book, chapter, verse, scroll/focus position, highlights, notes, bookmarks and reading progress — those are keyed by book/chapter/verse, not by translation, so this already holds; it will be verified.
- Attribution line under the chapter text (the existing copyright caption) shows the Biblica notice plus "CC BY-SA 4.0" with a link to the licence, and the same notice appears in the translation info on the About page.
- Offline download IS allowed for these two (unlike NIV/NKJV/MSG), since CC BY-SA permits redistribution.
- Search and Concordance stay on their existing behaviour: no upstream index exists for Yoruba/Igbo, so search falls back to the default translation and the panel says which version it searched (existing mechanism).

## Technical changes

Translation model (`src/lib/translations.ts`)
- Add `yoruba` and `igbo` ids with `apiBibleId`, `copyright`, and new optional fields `licenceName` / `licenceUrl` for the CC link.
- Split the current single `copyright` flag into two concepts: `copyright` (attribution to display) and a new `displayOnly: true` marker carried by NIV, NKJV and MSG. `isLicensedTranslation()` / `LICENSED_TRANSLATION_IDS` switch to `displayOnly`, so the offline guards in `chapter-query.ts`, `offline/download.ts` and `offline/bundle.server.ts` keep blocking the three restricted texts while allowing the two CC ones.
- `src/lib/chapter.server.ts`: the `licensed` check for the DB fallback cache also moves to `displayOnly`, so Yoruba/Igbo benefit from the outage cache.

Fetching
- No new adapter. `apibible.server.ts` already handles USFM book ids, plain-text parsing and the API key; the two new bibles use it unchanged.

UI
- `ReaderChrome` picker: full name + language label for every entry, including the new ones.
- `ChapterReader` caption and `OfflineBibleSection`: render `copyright` plus the licence name/link when present; the offline section no longer refuses these two.
- About page: add the Biblica attribution block for both translations.

Release notes
- New entry, version bump in `src/lib/version.ts` and `release-notes.ts`, icon `languages`, titled "New: Yoruba and Igbo Bible translations" with the supplied summary.

## Validation

Manual pass in the preview: open both translations, switch mid-chapter and confirm position/highlights survive, verse selection, deep link, share, offline save, mobile/PWA layout, and that KJV plus all existing versions still load unchanged. Existing domain/share/reader tests must stay green.
