# Make KJV the default Bible version

## Goal
When a user opens Bible Atlas for the first time (or with no saved settings), the reader should default to the King James Version (KJV) instead of the World English Bible (WEB).

## Current state
`src/lib/translations.ts` exports `DEFAULT_TRANSLATION: TranslationId = "web"`. `src/components/reader/settings.tsx` reads this constant as the fallback translation in `DEFAULTS.translation`.

## Change
Update `DEFAULT_TRANSLATION` in `src/lib/translations.ts` from `"web"` to `"kjv"`.

## Behavior
- New visitors and users who have never changed the version will see KJV on first load.
- Users who have already selected a version will keep their saved preference from `localStorage`.
- The version switcher continues to offer WEB, KJV, and ASV; only the initial default changes.
