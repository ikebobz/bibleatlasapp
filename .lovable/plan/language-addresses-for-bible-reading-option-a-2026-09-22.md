# Language addresses for Bible reading (Option A)

## Goal

Every non-English Bible gets its own address that search engines can find, for example `/yo/genesis/1` or `/es/juan/3/16` kept as `/es/john/3/16`. Each language version has the correct language tag, translated titles and descriptions, and hreflang links to all its siblings. The page layout and reading experience stay exactly the same.

## Scope

- **Languages with their own addresses:** Yorùbá (`yo`), Igbo (`ig`), Français (`fr`), Deutsch (`de`), Português (`pt`), Español (`es`), 中文 (`zh`), plus Nederlands (`nl`) and Русский (`ru`), which are already in the app. Each uses its public-domain or openly licensed version: Segond, Luther, Almeida, Reina-Valera 1909, CUV, Statenvertaling, Synodal, and Biblica Yoruba/Igbo (CC BY-SA 4.0, with attribution shown).
- **Pages covered:** book pages, chapter pages and verse pages (`/{lang}/{book}`, `/{lang}/{book}/{chapter}`, `/{lang}/{book}/{chapter}/{verse}`).
- **Stays English only for now:** People, Places, Maps, Timeline and Concordance. Their profiles are written in English, and translating them would mean new content, which is out of scope. They keep hreflang set to English only.
- **English stays at today's addresses** (`/genesis/1`) with no prefix, and it is also the x-default.
- Book names in the address stay in English (`/fr/genesis/1`) so addresses remain stable. Headings and titles show the local book name where the app already has one; otherwise they keep the English name.

## What changes

1. **New language addresses.** `/{lang}/...` opens the reader in that language's version. The version picker, audio, offline, highlights and sharing work unchanged.
2. **Old links keep working.** `/genesis/1?lang=yo` permanently redirects (301) to `/yo/genesis/1`. Links with `?t=` for a specific version (like licensed api.bible versions) keep working, remain unindexed and still point their canonical to the English page.
3. **Device language settings still apply.** First-visit language detection and a user's saved choice keep working. Picking a language in the version menu moves you to that language's address so the address always matches what you're reading.
4. **Per-language metadata:**
   - `<html lang="yo">` and similar for each language, `en` for English.
   - Translated title and description templates for each language, for example "Jẹ́nẹ́sísì 1 — Bibeli Atlas". I'll write short templates with book names for each language from the app's existing data. I won't write any Bible text myself.
   - A self-referencing canonical for each language page.
   - hreflang for each language plus x-default, on every reader page, in both directions.
   - Structured data carries `inLanguage` for each language.
5. **Sitemaps.** New `/sitemaps/{lang}-books.xml`, `-chapters-N.xml` and `-verses-N.xml` for each language, with hreflang alternates included. No lastmod, because there's no real per-page date. They're listed in the sitemap index.
6. **Share links.** "Share verse" from a non-English reader gives the language address.

## Verifying

- In the raw HTML of `/yo/genesis/1`, `/fr/john/3/16` and `/genesis/1`: correct `<html lang>`, translated title, single self canonical, full hreflang set with x-default, and verse text in the right language.
- `/genesis/1?lang=yo` returns 301 to `/yo/genesis/1`, and an unknown code such as `/xx/genesis/1` returns 404.
- The language sitemaps are valid XML and their addresses return 200.
- The existing tests pass, with new tests for address building, redirects and the hreflang set.
- Browser checks at phone and desktop sizes for reading, arrows, chapter picker, version switching and offline reading.

## After this

The quick wins from the audit come next: 404s for unknown names, sitemap cleanup, journey page text and headings, and per-page share images. Then the separate pages for each journey and the family tree pages.

## Technical details

- New route files: `src/routes/$lang.$book.index.tsx`, `$lang.$book.$chapter.tsx`, `$lang.$book.$chapter.$verse.tsx`. Each validates `$lang` against a new `LANG_ROUTES` map in `src/lib/translations.ts` (code → translation id) and throws `notFound()` for an unknown code. Book slugs don't clash with language codes, which the tests will check.
- The existing reader components are reused, with the translation passed from the route. The language address wins over the saved setting and becomes the saved setting, matching today's `?lang=` rule.
- `__root.tsx`: `<html lang>` comes from the matched route's language.
- `src/lib/reader-head.ts`: builds the canonical, hreflang alternates and localized title/description for each language. A new `src/lib/i18n-meta.ts` holds the templates for each language.
- The `?lang=` redirect happens in the existing `$book.$chapter(.$verse)` route `beforeLoad` with a 301 response on the server. `?t=` is untouched.
- `src/lib/sitemap.ts` gets language sections and `xhtml:link` alternates.
- `share.ts` and `verseLanguageUrl()` switch to the language address.
- Nothing changes in the backend or database.
