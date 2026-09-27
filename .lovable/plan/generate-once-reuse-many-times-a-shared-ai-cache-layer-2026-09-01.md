# Generate once, reuse many times: a shared AI cache layer

## What the audit found

There are exactly five AI call paths in the app, all server-side, all already behind a two-layer cache (per-isolate memory + the shared `atlas_context` table in the database):

| Path | Feature | Shared cache today | Device cache today |
|---|---|---|---|
| `atlas/ai.server.ts` | Tapped-word context panel | yes | yes |
| `atlas/purpose.server.ts` | Artifact / object purpose | yes | yes |
| `threads/ai.server.ts` | Connection insights | yes | yes |
| `lexicon/lexicon.server.ts` (lexeme) | Original-language word card | yes | yes |
| `lexicon/lexicon.server.ts` (speech) | Pronunciation audio | yes | per-card only |

No UI component talks to the model directly, and the API key never leaves the server. There are no personalized or free-form AI conversations in the product, so nothing user-specific is at risk of leaking through a shared cache.

So the "generate once, reuse many times" rule is already largely in place. The real gaps are correctness and control, not the existence of a cache.

## The four gaps worth fixing

1. **Cache keys ignore translation and prompt version.** A key is `kind|term|reference`. The verse text sent to the model differs per translation, so a panel generated from the KJV wording is currently served to a reader on another version, and changing a prompt cannot be rolled out without wiping the table.
2. **No request coalescing.** Ten readers tapping the same word within a second produce ten model calls. Nothing claims a key while generation is in flight.
3. **Nothing is measurable per feature.** Cache hits are logged to ops metrics, but the cache table itself has no usage count, token count, status, or last-accessed time, so hit rate, tokens avoided, and demand ranking can't be reported.
4. **No way to correct a bad shared answer.** Once a weak explanation is cached it is served to everyone forever with no review, disable, or regenerate path.

## Work

### 1. One AI context service

Add `src/lib/ai/context-service.server.ts` as the single entry point every AI feature calls: normalize input → build key → memory lookup → shared lookup → single-flight claim → model call → validate → persist → record metrics. The five existing server modules keep their public function signatures and their prompts; they hand their model call to the service instead of managing their own cache. No UI or server-function contract changes.

### 2. Versioned, translation-aware keys

Key shape becomes `ai:<kind>:<entity>:<reference>:<translation>:<lang>:v<promptVersion>`, with translation and language omitted where the answer genuinely doesn't depend on them (place/person profiles, pronunciation). Each feature declares its own prompt version constant; bumping it generates fresh content without deleting old rows. Translation flows in from the reader's current version, which the client already knows.

### 3. Request deduplication

Two layers. Inside an isolate, an in-flight promise map returns the same pending generation to every concurrent caller. Across isolates, a claim row is inserted for the key before the model call; a caller that loses the race polls briefly for the winner's result and falls back to its own call only if the winner fails or takes too long.

### 4. Cache record upgrade and metrics

Extend `atlas_context` with prompt version, translation, language, status (`active`/`disabled`), usage count, last-accessed, and token usage; add an in-flight claim table for deduplication. A small database function bumps usage counters cheaply on read. Add an AI cache section to the existing admin ops dashboard: hit rate per feature, tokens avoided vs consumed, top requested entries, and misses over time.

### 5. Admin review and regeneration

On the admin dashboard, list cached entries by feature and demand, and allow disable, regenerate (bump the entry's version), and delete. Disabled entries are treated as a miss and regenerated on next request.

### 6. Pre-generation, demand-driven

A small admin action pre-generates the top N entries by recorded demand (most-requested words, places, and passages already visible in metrics) so popular content is warm. Nothing is mass-generated speculatively.

### 7. Offline and device layer

Keep the existing localStorage caches, key them with the same versioned key so a prompt bump invalidates them too, and add the pronunciation audio store that today lives only in a component ref.

## Quality and failure behaviour

A failed or malformed generation is never written to the shared cache; the caller gets the current fallback message and a bounded retry. Scripture references stay attached to every stored payload, and the existing "generated content — check it against the passage" notice stays.

## Reporting

After the build I'll deliver the engineering report you asked for: call paths, key strategy, deduplication design, storage schema, versioning, measured hit rate, and estimated tokens avoided.

## Technical notes

- Reuses `atlas_context`, `ops_metrics`, and the existing rate limiter; no parallel AI system.
- Migration adds columns with defaults plus one claim table, with grants and RLS matching current locked-down tables (service-role only; the admin dashboard reads through authenticated server functions).
- Existing rows stay valid: they are treated as version 1 with unknown translation and are superseded naturally as versions bump.
