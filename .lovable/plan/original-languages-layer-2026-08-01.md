# Original Languages Layer

Let readers tap any word in a verse and see the Hebrew or Greek behind it, with meaning, root, pronunciation and where else it appears.

## How it feels

- A new "Original language" toggle sits with the reader settings (and in the verse hover controls). When on, every word in the Scripture text becomes tappable with a subtle underline; when off, reading stays exactly as it is today so the existing Atlas/measure triggers keep priority.
- Tapping a word opens a compact **Lexicon card** — same overlay style as the coin/measure tip on desktop, a bottom sheet on mobile — anchored to the word, with the passage still visible.
- The card shows, in order:
  - The original word in Hebrew/Greek script, large, with transliteration underneath
  - A speaker button for audio pronunciation, plus a written pronunciation guide (e.g. `ah-GAH-pay`)
  - Original meaning (one line) and the fuller meaning range as a short list of senses
  - Root word (with its own transliteration; tapping it re-opens the card on the root)
  - Other occurrences: a handful of references with a phrase of context, each clickable to jump to that verse in the reader
  - Related words: sibling terms from the same root or semantic family, also tappable
- "Open full entry" expands the same content into the Atlas side panel for longer reading, joining the existing panel stack (so Back works).

## How the data is produced

Word-level Hebrew/Greek data isn't in the current text source (bible-api WEB has no Strong's tagging), so the layer is generated on demand and cached, mirroring the existing artifact-purpose pattern:

- A server function takes the clicked English word, its verse reference and full verse text, and asks the AI Gateway for a strictly structured lexicon record (script, transliteration, pronunciation, gloss, sense range, root, occurrences, related words), instructed to be historically careful, to name the Strong's number when confident, and to mark uncertainty rather than invent.
- Results are keyed by `reference|word` and cached both in a bounded server-side map and in localStorage, so re-tapping the same word is instant and identical across reloads — same approach already used for purpose notes.
- Occurrence references are validated against the app's book list before being rendered as jump links, so a bad reference degrades to plain text rather than a broken navigation.

## Audio pronunciation

- Primary: a text-to-speech server function through the AI Gateway, returning audio for the transliterated/【original】 word, cached alongside the lexicon record for the session.
- Fallback: the browser's built-in speech synthesis if audio generation is unavailable, so the speaker button never dead-ends. If neither works the button hides and the written pronunciation guide stands alone.

## Technical notes

- `src/lib/lexicon/lexicon.server.ts` — AI call, JSON schema validation with Zod, bounded in-memory cache.
- `src/lib/lexicon/lexicon.functions.ts` — `getLexeme` and `getPronunciationAudio` server functions (thin wrappers only).
- `src/lib/lexicon/cache.ts` — localStorage cache, same shape/limits as `purpose-cache.ts`.
- `src/components/reader/LexiconTip.tsx` — anchored popover, reusing `MeasureTip`'s positioning and dismissal behaviour.
- `src/components/reader/Verse.tsx` — when the language layer is on, plain `text` segments are split into word spans; existing `entry`/`measure`/`auto` segments keep their current behaviour, with the lexicon available as a secondary action inside their panel.
- `src/components/reader/settings.tsx` — persisted `originalLanguage` preference.
- A new `lexicon` block type in `src/lib/atlas/types.ts` + `BlockView.tsx` for the expanded side-panel view.

## Out of scope for this pass

- Interlinear alignment of the whole chapter (every word tagged from a licensed Strong's dataset) — that needs a tagged text source rather than the current plain WEB API.
- Morphological parsing tables (tense/stem/person) beyond what the lexicon card lists.
