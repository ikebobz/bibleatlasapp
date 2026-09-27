# First-run device-language detection + Spanish Bible

## Goal

A first-time visitor whose device is set to Spanish, German, Yorùbá, etc. opens the app directly in that language's Bible — no manual switch. Includes adding a Spanish translation so Spanish devices actually get Spanish.

## What changes

### 1. Add Reina-Valera 1909 (Spanish, public domain)

- New registry entry in `src/lib/translations.ts`: `id: "rv1909"`, label "RV1909", language "Español", public-domain blurb, offline-downloadable like the other public-domain translations.
- Text source: wire through the same fetch pipeline as the other public-domain translations (the `apiCode` path), after verifying the upstream source carries RV1909; if it doesn't, use the next existing free-source path (API.Bible catalogue or the open-Bible source the Biblica translations use). Implementation verifies which source serves it before committing to one.
- Add `Español: "es"` to `LANGUAGE_ISO` so `?lang=es` deep links and detection resolve to it.
- Spain note: this is what makes the Spanish-device example work — Latin (`?lang=la`) stays its own language.

### 2. First-run device-language detection

- `storedTranslation()` (and the shared default in `settings.tsx`) becomes device-aware **only when the user has never chosen a translation** (no saved settings in localStorage):
  - Read `navigator.language` (then `navigator.languages` in order), take the base code (`es-ES` → `es`), resolve via the existing `defaultTranslationForLanguage()`.
  - First match wins; no match → KJV as today.
- Once any translation is saved (manual picker choice, `?t=`/`?lang=` link adoption), the saved choice always wins — detection never overrides it again.
- SSR/prerender keeps returning KJV (no `navigator` server-side); detection applies in the browser only, so no hydration mismatch beyond the text language itself.

### 3. Tests

- Unit tests for the detection helper: `es-ES` → `rv1909`, `yo` → `yoruba`, unknown locale → `kjv`, saved setting beats detection.
- Registry test covering the new `rv1909` entry and `es` ISO mapping.

## Technical notes

- Detection must run before the chapter query resolves the translation on first load, so the very first render is already in the device language (no flash of English).
- Existing behavior untouched: `?t=` > `?lang=` > saved > device > KJV.
- Licensed display-only translations (NIV/MSG) are excluded from detection results by construction — detection only resolves languages that have a real registry translation.
