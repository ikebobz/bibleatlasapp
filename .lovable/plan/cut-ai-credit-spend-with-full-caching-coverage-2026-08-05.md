# Cut AI credit spend with full caching coverage

Three AI features still hit the model more often than they need to. This plan extends the existing three-layer cache pattern (device localStorage → shared database → in-memory) to all of them.

## What changes for readers

- Tapping the same connection node, word, or pronunciation twice is instant and free.
- A panel another reader already generated loads from the shared cache instead of a new AI call.
- No visible UI change; only speed and cost.

## Current state

| Feature | Memory | Shared (DB) | Device |
|---|---|---|---|
| Atlas context panel | yes | yes | yes |
| Artifact purpose | yes | yes | yes |
| Thread insight | yes | no | no |
| Lexicon word | yes | no | yes |
| Pronunciation audio (TTS) | no | no | no (per-card only) |

## Work

1. **Thread insights** — add shared caching in `src/lib/threads/ai.server.ts` via the existing `readCachedContext`/`writeCachedContext` helpers under a new `thread` kind, keyed by label + reference. Add `src/lib/threads/insight-cache.ts` (localStorage, same bounded 400-entry shape as `context-cache.browser.ts`) and read it in the connection panel before calling the server function.

2. **Lexicon words** — add the shared database layer to `src/lib/lexicon/lexicon.server.ts` under a `lexeme` kind so a word generated on one device serves every device. Device cache already exists and stays.

3. **Pronunciation audio** — persist generated TTS instead of holding it in a component ref. Cache the base64 data URI per lexeme key in localStorage with a small entry cap (audio is large, so ~40 entries and a size guard), and skip the speech call on a hit.

4. **Check device cache before the round-trip** — where a component still calls the server first, read localStorage synchronously and return early, so repeat taps cost neither a request nor a credit.

## Technical notes

- Reuse the `atlas_context` table and its existing kind column; no migration needed unless the kind column is constrained, in which case a small migration widens the allowed values.
- Cache reads stay best-effort: quota errors and private mode fall through to the current behaviour.
- Audio entries are stored separately from lexeme records so a full audio store can be evicted without losing text.
