# Add The Message (MSG), announce it, and simplify the version picker

## Why MSG is missing today

When your API.Bible key was wired up, only NIV and NKJV were added to the translation registry. MSG was never registered, so the reader has no entry for it. I checked your key against API.Bible just now: Bible ID `6f11a7de016f942e-01` returns "The Message" (MSG, English) successfully, so it can be added exactly like NIV and NKJV.

## 1. Add MSG to the reader

- Register MSG in the translation list under English with its API.Bible ID and the required copyright line ("THE MESSAGE: The Bible in Contemporary Language copyright © 1993, 2002, 2018 by Eugene H. Peterson…").
- It uses the same licensed path as NIV/NKJV: fetched server-side per request, copyright shown under each chapter, offline download blocked, search falls back to the KJV index.

## 2. Announce it in the returning-reader popup

- Add a 2.3.0 release entry titled around new translations, covering NIV, NKJV and MSG, with a link into the reader.
- Bump the app version so the "what's new" dot and the returning-reader announcement fire again, and update the announcement card's copy and its one-time storage key so people who dismissed the previous one still see this.

## 3. Simplify the translation picker

- Show only the translation name and abbreviation (e.g. "The Message (MSG)"); remove the descriptive blurb line under each option. Language grouping, the checkmark and the header badge stay as they are.

## Technical notes

- `src/lib/translations.ts`: add `msg` to `TranslationId` and `TRANSLATIONS` with `apiBibleId` + `copyright`. No `apiCode`/`searchCode`.
- `src/lib/release-notes.ts`: new 2.3.0 entry; `src/lib/version.ts`: `APP_VERSION = "2.3.0"`.
- `src/components/reader/WhatsNewAnnouncement.tsx`: new `KEY` constant and updated text.
- `src/components/reader/chrome/ReaderHeader.tsx` (`VersionMenu`): drop the `blurb` line from each option.
- Existing licensed-translation guards (offline block, copyright render) already key off `apiBibleId`, so MSG inherits them with no further changes.
