# NKJV licence request, and promoting the versions the key already authorises

I checked the live API.Bible catalogue with our key: it authorises 258 bibles, 47 of them English. **NKJV is not among them** — it never was on this key, which is why the old hardcoded id 404'd and got dropped. The upgrade didn't take it away.

What the key *does* authorise, and what we've never surfaced properly: AMP (Amplified), NLT (plus Anglicised and Catholic editions), CEV, GNT, FBV, LSV, Geneva Bible, Revised Version 1885, Cambridge Paragraph KJV, T4T, and the Brenton Septuagint — alongside NIV and The Message which we already carry.

## Part 1 — The NKJV licence request

NKJV is Thomas Nelson / HarperCollins Christian Publishing. It is licensed case by case, not bundled into a standard API.Bible plan, so it has to be requested and added to our key's entitlements.

I'll produce a ready-to-send request covering what rights holders ask for:

- Product description: Bible Atlas, free web/PWA reader with maps, timelines and study context, at mybibleatlas.com.
- Usage: chapter-level reading, verse search, single-verse sharing; text fetched per request, never redistributed or stored in bulk.
- Current traffic and monetisation status (I'll leave a blank for you to fill).
- Confirmation that we already honour display-only rules for licensed texts: offline download refused, copyright line rendered with the text.
- The specific ask: add NKJV to our existing API.Bible key's authorised bibles.

Delivered as a markdown file in the repo (`docs/nkjv-licence-request.md`) with the API.Bible support address and the HarperCollins Christian permissions route, so you can paste and send. No app behaviour changes here.

## Part 2 — Promote the authorised versions in the picker

The catalogue route already streams all 258 bibles into the version menu, but they arrive as generic entries: truncated abbreviations, a stock "licensed via API.Bible" blurb, and no ordering, so AMP and NLT are buried among hundreds of rows.

Changes:

- Add a curated overlay list in `src/lib/translations.ts` for the notable authorised English texts (AMP, NLT, CEV, GNT, FBV, LSV, Geneva, RV 1885) — proper name, label, one-line blurb, and a sort weight. These stay dynamic `apibible:` ids so nothing about fetching, caching or the display-only guards changes; the overlay only improves how they render.
- When the catalogue response registers a row that matches a curated entry, the curated name/label/blurb wins.
- In `src/components/reader/chrome/ReaderHeader.tsx`, sort each language group so curated entries come first, after the public-domain built-ins.
- Filter out the near-duplicate editions the catalogue ships (four WEB variants, three NLT editions, three GNT editions) so the English group stays readable — keep one per abbreviation, preferring the primary edition id.
- Remove the stale NKJV mentions in `src/lib/release-notes.ts` copy so the app never advertises a version it can't serve.

All of these are display-only and already blocked from offline download by the existing `displayOnly` guard; each carries the catalogue's copyright string, which the reader caption and `/about` already render.

## Verification

Open the version picker and confirm: public-domain texts unchanged and first, then AMP/NLT/CEV/GNT/etc. with real names, no duplicate WEB or NLT rows, no NKJV anywhere. Load a chapter in AMP and in NLT, run a search in each, and confirm offline save is refused for them and still works for KJV. Existing tests stay green.
