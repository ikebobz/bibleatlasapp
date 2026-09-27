# Live dashboard for shared AI answers, per verse and per word

## Goal
Add a live view in the admin area that shows, for each verse reference and each word/place explained, how many times the shared answer was reused (hits), how many times it had to be generated (misses), and how many AI tokens that reuse saved. Numbers refresh on their own while the page is open.

## What gets added

1. **Two new database summaries**
   - One grouped by verse reference (e.g. Genesis 1:1): entries, reuses, generations, tokens saved, last used.
   - One grouped by word/term: same figures.
   - Both read only the existing shared-answer table; no new data is collected.

2. **A new "Per verse and word" dashboard section** on the existing admin page that already shows shared AI answers:
   - Headline figures: total hits, total misses, hit rate, tokens saved, estimated calls avoided.
   - Two ranked tables (top verses, top words) with a search box to filter by verse or word and a toggle to sort by hits or tokens saved.
   - A feature filter (word explanation, place/context, purpose, thread, audio).
   - "Live" behaviour: auto-refresh every 15 seconds while the tab is visible, a last-updated stamp, and a manual refresh button. Pauses when the tab is hidden.

3. **Reuse of existing controls**: each row keeps the existing Disable / Regenerate actions so a bad answer can be handled from the same place.

## Technical scope
- Migration adding `ai_cache_by_reference(_kind text, _limit int)` and `ai_cache_by_term(_kind text, _limit int)` security-definer SQL functions over `public.atlas_context` (hits = `usage_count`, misses = row count, tokens saved = `tokens * usage_count`), executable by the service role only.
- Extend `src/lib/admin/ai-cache.functions.ts` with an admin-gated server function returning both breakdowns plus totals, keeping the existing admin session check.
- New `src/components/admin/AiCacheBreakdown.tsx` rendering the tables and live polling; mounted in `src/routes/admin.devices.tsx` beside the existing `AiCachePanel`.
- No change to generation, caching, or reader behaviour.

## Validation
- TypeScript check and the existing test suite.
- Verify the two new functions return expected rows against live data.
