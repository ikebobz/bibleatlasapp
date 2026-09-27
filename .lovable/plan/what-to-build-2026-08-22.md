Create a Supabase Edge Function named `get-audio-chapter` that proxies chapter-audio metadata from API.Bible.

## What to build

1. **Edge function scaffold**
   - Create `supabase/functions/get-audio-chapter/index.ts`.
   - Use `Deno.serve()` with a handler that accepts POST and responds with CORS headers.

2. **Request contract**
   - Accept JSON body: `{ bookSlug: string, chapterNumber: number | string }`.
   - Validate that both fields are present, `bookSlug` is non-empty, and `chapterNumber` is a positive integer.
   - Return a `400` JSON error if validation fails.

3. **Book slug → USFM mapping**
   - Include a complete mapping from URL slugs (`genesis`, `1-samuel`, `john`, etc.) to 3-letter USFM codes (`GEN`, `1SA`, `JHN`).
   - Build the API.Bible chapter id as `${USFM}.${chapterNumber}` (e.g. `JHN.3`).
   - Return `404` for unknown slugs.

4. **Upstream API call**
   - Read `API_BIBLE_KEY` via `Deno.env.get('API_BIBLE_KEY')`.
   - If missing, return `500` with a safe error message.
   - `GET https://api.scripture.api.bible/v1/audio-bibles/de4e12af7f28f599-01/chapters/${chapterId}` with header `api-key: ${API_BIBLE_KEY}`.
   - Forward the upstream JSON response body to the client with the matching status code.
   - On network or non-2xx upstream errors, return a JSON error with the upstream status/message.

5. **Deno test file**
   - Add `supabase/functions/get-audio-chapter/index_test.ts` (or `*.test.ts`) with unit tests for:
     - validation errors,
     - USFM mapping,
     - unknown book slug,
     - graceful upstream error handling.
   - Mock `fetch` and `Deno.env.get` in tests.

6. **Deployment and verification**
   - Deploy the function via the Supabase deploy tool.
   - Verify `API_BIBLE_KEY` is available to the function (it is already in the project secrets).
   - Smoke-test the deployed endpoint with a request for `john`, chapter `3`, confirming a JSON response containing the audio chapter data.

## Out of scope

No changes to the Bible Atlas reader, UI, or routing in this turn. The function is a standalone API endpoint that the frontend can call later if needed.
