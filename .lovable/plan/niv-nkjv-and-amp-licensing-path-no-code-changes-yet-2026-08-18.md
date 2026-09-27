# NIV, NKJV and AMP — licensing path (no code changes yet)

These three are copyrighted. Nothing can be added to the reader until a licence is in hand, so this plan is the steps to get one. No files change now.

## Who to contact

| Version | Rights holder | How access is usually granted |
| --- | --- | --- |
| NIV | Biblica (text) / Zondervan (NA publishing) | Permissions request to Biblica; digital delivery normally through API.Bible (American Bible Society) or a Bible Gateway partnership |
| NKJV | Thomas Nelson — HarperCollins Christian Publishing | Permissions request to HarperCollins Christian; delivery through API.Bible |
| AMP | The Lockman Foundation | Direct licence with Lockman; delivery through API.Bible |

Practical route: register a developer account at **api.bible**, request each of the three texts, and the platform routes the approval to the rights holder. Expect a few weeks and, for commercial or high-volume use, fees or a revenue share.

## What to tell them when applying

- Product: Bible Atlas, a free web/PWA Bible reader with maps, timelines and study context.
- Usage: chapter-level reading, verse search, single-verse sharing.
- Traffic estimate and whether the app is monetised.
- Confirmation that text is fetched per request and not redistributed in bulk.

## Licence terms that will shape the build

Worth checking each of these during negotiation, because they decide how much work the integration is:

- Copyright/attribution line must be displayed with the text.
- Verse-quota limits per user action — affects verse sharing and the generated preview cards.
- Bulk download and caching are normally prohibited — the offline downloader would be disabled for these versions.
- Search indexing rights — may block full-text search in those translations.
- Attribution wording for shared links and social previews.

## When the licence arrives

The implementation work, for reference:

1. Add an API.Bible source adapter alongside the existing bible-api.com and bolls.life sources.
2. Store the provider key as a backend secret; all calls stay server-side.
3. Extend the translation registry with a `licensed` flag carrying: required copyright notice, share verse cap, offline allowed (false), search allowed.
4. Honour those flags in the reader caption, share text, preview card, offline section and search bar.
5. Show the licensed versions in the picker only once keys are configured.

Existing public-domain versions and the KJV default stay exactly as they are.
