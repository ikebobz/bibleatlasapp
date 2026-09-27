# Make shared AI generation genuinely single-flight

## Goal
Ensure identical requests for the same word, place, or other shared AI context produce only one model call across all running server instances.

## Implementation
1. **Replace the best-effort claim with an owner-bound lease**
   - Add a database migration that gives each cache claim a unique owner token and expiry time.
   - Acquire expired/missing claims atomically, renew only claims owned by the current generator, and release only with the matching owner token.
   - Keep claim functions private to the trusted server role and preserve locked-down table access.

2. **Make generation fail closed**
   - Treat cache-read and lock-service failures as temporary service errors rather than permission to call the AI model.
   - Remove the current fixed wait followed by unconditional generation.
   - A request that loses the claim will keep checking for the shared answer and retry acquisition only after the owner releases or its renewable lease genuinely expires.

3. **Protect long generations**
   - Renew the lease while the model request is running so requests lasting longer than the initial lease cannot be claimed by another server instance.
   - Clean up renewal and release work in all success and failure paths without imposing an artificial timeout on the AI request.

4. **Add concurrency and failure regression tests**
   - Simulate separate server instances requesting the same uncached key concurrently and assert exactly one gateway call occurs.
   - Verify lock RPC errors result in zero gateway calls.
   - Verify a waiting request receives the first generator’s cached answer, and that an abandoned expired lease can be recovered safely.
   - Preserve the existing behavior for cached and admin-disabled answers.

## Validation
- Run the focused AI cache tests and the project TypeScript check.
- Verify the migration functions return the expected acquire, renew, and owner-bound release results.

## Technical scope
Changes are limited to the shared AI context service, its database claim functions, and cache tests. No reader design or unrelated AI features will change.
