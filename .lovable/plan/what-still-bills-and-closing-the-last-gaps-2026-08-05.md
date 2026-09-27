# What still bills, and closing the last gaps

## What the gateway logs show

Over the last 7 days there were 128 gateway requests. Recent ones (all successful):

- `019fd408-f344-...` 2026-08-05T22:26:28Z — gemini-2.5-flash chat, 0.0072 credits
- `019fd3fa-6da4-...` 22:10:36Z — chat, 0.0066
- `019fd3fa-2b40-...` 22:10:20Z — chat, 0.0074
- `019fd3f9-b9d0-...` 22:09:50Z — chat, 0.0071
- `019fd3f9-8ff2-...` 22:09:37Z — gpt-4o-mini-tts speech, 0.0022
- `019fd3f9-822c-...` 22:09:33Z — chat, 0.0015

Typical cost is well under one hundredth of a credit per call; text lookups dominate, pronunciation audio is roughly a third of that each.

## Verified current cache state

- Shared database cache table holds 36 `context` rows and 4 `purpose` rows.
- There are **zero** `lexicon` and `thread` rows, so the shared layer added for those two has not yet stored anything — the code is in preview but no lookup has run through it since.
- Pronunciation audio has no shared layer at all; it is device-only, so the first tap on each new device still bills.
- The metrics table shows only Scripture rows for the last two days — no AI rows — so the admin cache-hit panel currently cannot prove any of this.

## Work

1. **Prove the new caches actually write.** Run one thread-insight lookup and one lexicon lookup against preview, then confirm a `thread` and a `lexeme` row appear and that a second identical lookup produces no new gateway request. If the write is silently failing, fix it (the write path swallows all errors today).

2. **Surface the swallowed errors.** Log a short warning when a shared-cache write fails instead of discarding it, so a broken cache is visible rather than invisible.

3. **Add a shared layer for pronunciation audio.** Store the generated audio keyed by the spoken word so the first reader pays once for everyone, instead of once per device. Audio is stored separately from text entries and capped.

4. **Make AI telemetry reliable.** The metrics buffer only flushes after 12 events or 5 seconds, which a short-lived request rarely reaches, so AI events are lost. Flush AI events immediately (they are low-volume) so the admin panel reports real hit rates.

## Result

After this, a repeat tap on the same connection node, word, or pronunciation costs nothing on any device, and the admin panel shows the hit rate that proves it.

## Technical notes

- Audio cache reuses the existing shared table under an `audio` kind; the kind column has no check constraint, so no migration is needed.
- Keep all cache reads and writes best-effort — a cache outage must never block reading.
