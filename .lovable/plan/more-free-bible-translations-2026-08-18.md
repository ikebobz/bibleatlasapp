# More free Bible translations

Extend the existing version picker (WEB, KJV, ASV) into a proper translation selector with a curated set of public-domain translations in English and several world languages. KJV stays the default and behaves exactly as it does today.

## Translations to add

All are pre-1929 or otherwise public domain, and all are served by the two text sources the app already uses (bible-api.com primary, bolls.life fallback and search index). Licensing verified against the source catalogues before adding; nothing copyrighted (NIV, ESV, NLT, RVR1960) will be included — if a user asks for those, the picker simply won't list them.

English
- KJV — King James Version (default, unchanged)
- WEB — World English Bible
- ASV — American Standard Version (1901)
- YLT — Young's Literal Translation (1898)
- DARBY — Darby Translation (1890)
- BBE — Bible in Basic English (1949/64, public domain)
- DRA — Douay-Rheims American Edition

Other languages
- LUT1912 — Luther Bibel (German)
- LSG — Louis Segond 1910 (French)
- RV1909 — Reina-Valera 1909 (Spanish)
- ALMEIDA — João Ferreira de Almeida (Portuguese)
- SVV — Statenvertaling (Dutch)
- SYNOD — Russian Synodal (Russian)
- CUV — Chinese Union Version (Chinese)

Each entry is verified for chapter fetch and search coverage during implementation; any that fails verification is dropped from the list rather than shipped broken.

## What the reader sees

- The header control keeps its current shape (`KJV ▾`) but the menu now groups options by language, showing full name, abbreviation and an "offline" marker when that translation is stored on the device.
- The list is scrollable, keyboard navigable and touch friendly on small screens; the current highlighted-active-item styling and design tokens are unchanged.
- Switching translations while reading John 3:16 keeps you on John 3:16 — same chapter, same scroll position, same focused verse — and swaps only the text.
- The caption and screen-reader label under the chapter read the selected translation's full name.
- Choice persists across sessions via the existing settings storage.

## Search, sharing, offline

- Search already runs against the active translation; the results panel gains a clear "searched in <ABBR>" label, and results stay keyed per translation so switching doesn't duplicate or mix hits.
- Verse sharing already carries the translation in the link (`?t=`); the shared text and the generated preview card gain the abbreviation after the reference ("John 3:16, ASV"). KJV shares stay byte-identical to today.
- Offline: the existing KJV bulk downloader is generalised to take a translation id. The offline section lists downloaded translations with size and a delete action, and lets you download any listed translation explicitly. Nothing downloads automatically, and the current KJV download/storage behaviour is untouched.
- Concordance stays KJV-indexed and translation-independent (it is a KJV word index); its panel notes that it searches the KJV so the distinction is clear. Strong's/original-language data remains unaffected by the selected translation.

## Untouched

Routing (`/john/3/16` stays translation-independent), highlights, bookmarks, reading progress, Atlas overlays, maps, journeys, timelines, genealogies, connections, AI features, PWA and push all key off book/chapter/verse and keep working across every translation.

## Technical changes

- `src/lib/translations.ts`: widen `TranslationId`, add `language` and `offlineCapable` fields to `Translation`, and add the entries above. Everything downstream already derives from this list (`TRANSLATION_IDS` feeds the Zod validators in `chapter.functions.ts` / `search.functions.ts`), so no validator edits are needed.
- `src/components/reader/chrome/ReaderHeader.tsx`: group the menu by `language`, add offline markers and scroll/aria handling.
- `src/lib/share.ts` + `src/lib/og/verse-card.ts`: append the abbreviation to the reference in share text and the preview card.
- `src/components/reader/SearchBar.tsx`: show the searched-translation label.
- `src/lib/offline/kjv-download.ts` → generalised `translation-download.ts` (KJV wrapper kept for existing callers) and `src/components/reader/chrome/OfflineBibleSection.tsx`: per-translation download, progress, size and delete.
- No new dependencies, no bundle growth beyond the translation table; chapters are fetched per chapter and cached exactly as now.

## Verification

Switch through several translations on John 3:16 (including a non-Latin one), confirm the verse stays in place; run a search in two translations; share a verse in ASV and check the link and preview; download a non-KJV translation offline, read it with the network off, then delete it; confirm KJV offline and concordance are unchanged.
