# Fix Original Languages pronunciation

## Root cause (confirmed)
- The voice service itself works: a test request for "shalom" returned audio successfully, and the voice model in use is still available.
- The recent security fix made word lookups and pronunciation **require a signed-in account**. Ordinary readers aren't signed in (only the admin portal signs anyone in), so for them the audio request is refused every time.
- When that happens, the button quietly falls back to the browser's own voice, reading the Latin transliteration. That fallback is unreliable: many desktop browsers have no suitable voice, and Safari/iOS blocks sound that starts after a delay rather than straight from the tap. So you get nothing, silence, or different results on each device. Hebrew and Greek fail in the same way, because the refusal happens before language matters.
- Knock-on effect: the full word card (meaning, root, occurrences) goes through the same sign-in check, so uncached words may show "could not be loaded" for readers too.

## Fix
1. **Let readers use it again without signing in, while keeping it protected.** Remove the sign-in requirement from the word lookup and pronunciation, and protect them instead with:
   - the existing per-visitor AI usage limit (already in place),
   - the shared answer store, so each word is only paid for once for everyone,
   - a request check that only accepts calls coming from the app's own site,
   - tight input limits (short single words only).
   Then close the related security findings with that explanation.
2. **Make playback reliable on every device.**
   - Start the sound as part of the tap, so Safari/iOS and installed apps allow it (prepare the player straight away, then load the sound into it).
   - Show a clear "Couldn't play pronunciation" message instead of failing silently.
   - Only use the browser voice as a backup when a suitable voice exists, and give it the correct language (Hebrew or Greek).
   - Throw away saved pronunciations that are empty or broken so they get fetched again.
3. **Test** Hebrew (shalom, bara, chesed, elohim) and Greek (logos, agape, pistis, charis) while signed out, in Chrome and a mobile Safari-sized view, plus repeat taps (served from the saved copy) and offline behaviour.

## Technical details
- `src/lib/lexicon/lexicon.functions.ts`: drop `requireSupabaseAuth` from `getLexeme` / `getPronunciationAudio`; add same-origin check via `getRequestHeader('origin'|'referer')` against allowed hosts; keep `enforceAiQuota`.
- `src/components/reader/LexiconCard.tsx` `SpeakButton`: create `new Audio()` synchronously in the click handler and call `play()` on it after setting `src` (with a silent unlock on iOS); toast on failure; `SpeechSynthesisUtterance.lang = "he-IL" | "el-GR"`, only if `speechSynthesis.getVoices()` has a match.
- `src/lib/lexicon/speech-cache.ts`: validate data URLs before reuse.
- Also check `getThreadInsight` / `getArtifactPurpose` for the same signed-out breakage and apply the same approach if confirmed.
- Security findings updated via the security tool with the rationale.
