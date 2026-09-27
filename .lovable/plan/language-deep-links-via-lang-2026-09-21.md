# Language deep links via ?lang=

## Current state (confirmed by reading the code)

- The reading translation is a device-local setting (localStorage via `storedSettings()` in `src/components/reader/settings.tsx`). Nothing about it appears in the URL or page source — that's why it was invisible.
- The chapter route (`src/routes/$book.$chapter.tsx`) and verse route (`$book.$chapter.$verse.tsx`) already accept `?t=<translationId>` as a shared-link override for that load only; it is not adopted and is not language-aware.
- All translations in `src/lib/translations.ts` are currently English; entries carry a `language: string` name but no ISO code.

## Decisions

- URL pattern: query param `?lang=` on existing reader routes (no path prefix).
- Opening a valid language/translation deep link adopts it as the saved device translation.

## What to build

1. **Language resolution in `src/lib/translations.ts`**
   - Add an `iso` field (ISO 639 code, e.g. `en`, `yo`) to each translation entry.
   - New helper `defaultTranslationForLanguage(code)`: normalizes case, matches on `iso` or language name, returns that language's default translation id or undefined.

2. **`lang` search param on reader routes**
   - `src/routes/$book.$chapter.tsx` and `src/routes/$book.$chapter.$verse.tsx`: add `lang: z.string().optional()` to the search schema (plain string; resolve inside, per search-param conventions).
   - Resolution order in the loader: `?t=` (exact translation) → `?lang=` (language default) → stored setting → default translation. Add `lang` to `loaderDeps`.

3. **Adoption (sticky deep links)**
   - In the chapter/verse route components: when a resolved deep-link translation differs from the stored one, update the reader settings (existing settings context setter) so the reader, picker, and subsequent navigation all follow it. Invalid/unknown `lang` values are ignored silently and never override the stored setting.

4. **Link generation**
   - Share/link helpers gain the ability to emit `?lang=` (or keep `?t=`) so senders can share by language without knowing translation IDs.

5. **SEO / canonical**
   - Canonical and og:url stay on the plain chapter/verse URL (no params), as today; `lang` is a reading preference, not separate indexable content.

6. **Verification**
   - Unit tests for `defaultTranslationForLanguage` and the resolution order (t beats lang beats stored).
   - `bunx tsgo --noEmit` and `bunx vitest run` green.
   - Manual check: `/genesis/12?lang=en` opens that translation and keeps it after navigating to the next chapter.

## Out of scope

- Path-prefix locales (`/yo/...`), hreflang sitemaps, and non-English translations themselves (no licensed/public-domain non-English text is bundled yet — the mechanism ships ready for them).
