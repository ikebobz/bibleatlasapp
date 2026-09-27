# Automated tests: repeat taps cost nothing, and survive a refresh

Add a fast Vitest suite (no browser) that proves the caching work actually holds: a second identical lookup makes zero AI calls, and the device caches still answer after a page reload.

## What gets tested

**1. Zero gateway calls on repeat (server side)**

For each AI surface — lexicon word, thread insight, artifact purpose, Atlas context, pronunciation audio — a test:

- stubs the AI gateway with a counting fake, and stubs the shared database cache with an in-memory store,
- runs the same lookup twice,
- asserts the fake gateway was called exactly once, and both results are identical word for word.

A second variant clears the in-memory layer between calls (simulating a recycled server instance) and asserts the shared database layer answers with still exactly one gateway call.

**2. Device caches survive a refresh (browser side)**

For the four localStorage caches — context, purpose, lexicon, thread insight, pronunciation audio — a test writes an entry, throws away the module state to simulate a full page reload, and asserts the value comes back intact and unchanged. Also covered:

- the entry cap evicts the oldest entries, never the newest;
- a corrupted or unavailable store (private mode, quota full) falls through quietly instead of throwing, so reading is never blocked;
- oversized audio clips are skipped rather than filling the store.

**3. UI stays correct across a refresh**

Component-level tests for the pieces the reader sees: the connection panel and the lexicon card render the cached record without issuing any server call when a device cache entry exists, and show the same text as the first render. Errors from the AI path still show the friendly fallback message rather than a blank panel.

## Technical notes

- Suite runs under the existing `bun run test` (Vitest). Server-cache tests stay in the current `node` environment; the localStorage and component tests need a `jsdom` environment, so the Vitest config gains per-file environment support and dev dependencies `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom`.
- No real network and no real database: the gateway is a `vi.fn()` over `fetch`, and `@/integrations/supabase/client.server` and `@/lib/monitor.server` are module mocks.
- Test files sit next to the code they cover (`*.test.ts` / `*.test.tsx`), never under `src/routes`.
- These are deterministic offline tests — they spend no AI credits when run.
