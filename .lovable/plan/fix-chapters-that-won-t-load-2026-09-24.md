# Fix chapters that won't load

## What's wrong (confirmed)
The new error details in the live logs show that the failing chapters come from the **Portuguese Almeida** version. I tested the text service directly:

- The main text service returns "not found" for Almeida in whole books. For example, Philippians 1 fails in Almeida but works in KJV.
- Almeida has only that one source, and a "not found" answer stops any retry. Nothing is saved for it either, so the reader sees "Could not load ... right now" every time.
- A second free service (getbible.net) carries the same Almeida text, and both Philippians 1 and 1 Samuel 11 load there.

A second, smaller cause is behind the "undefined" errors (Job 41, Psalm 140). When a visitor makes a lot of requests quickly, the app skips the text services and only looks for a saved copy. If there's no saved copy, the chapter fails without a clear reason.

## Fix
1. Add getbible.net as a backup source for Almeida, so a chapter still loads when the main service says "not found".
2. Check every version that currently has only one source against the upstream services. Add the same backup wherever getbible.net carries that version.
3. When a busy visitor is being slowed down and no saved copy exists, still try one text source before showing the error.
4. Make the error message give a clear reason, such as "slowed down, no saved copy", instead of "undefined".

## How I'll check it
- Philippians 1–4, 1 Samuel 11, Ecclesiastes and Psalms in Almeida load in the preview.
- A test covering the new backup source for Almeida.
- After you publish, the live error log should stop showing these failures.

## Technical details
- `src/lib/translations.ts`: `almeida` gets `getbibleCode: "almeida"` (plus any other versions confirmed in step 2).
- `src/lib/chapter.server.ts`: when `throttled`, run only the first attempt if the database fallback returns nothing. Set `lastError` to a descriptive Error when no attempt ran.
- Saved copies from getbible.net are written through `writeCachedChapter`, so later outages are served from our own store.
