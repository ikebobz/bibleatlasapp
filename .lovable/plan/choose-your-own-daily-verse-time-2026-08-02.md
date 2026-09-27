# Choose your own daily verse time

Right now every device is nudged at the same moment (10:00 UTC), which is the middle of the night for some readers. This adds a time picker so each device gets its verse at a time the reader chooses, in their own local time.

## What the reader sees

In the reading settings menu, under the "Daily verse" toggle, a new row appears once notifications are on:

- A **time picker** (native time input, 15-minute steps) defaulting to **07:00 local**.
- A quiet line under it confirming the zone, e.g. "Each morning at 7:00 AM, Africa/Lagos".
- A few one-tap presets — Early (6:00), Morning (7:00), Midday (12:00), Evening (20:00) — for readers who don't want to fiddle with a picker.

Changing the time saves immediately for that device, no separate save button. Each device keeps its own time, since a subscription belongs to a browser, not an account. Readers who already turned notifications on keep getting their verse; their existing devices are moved to 07:00 local (or 10:00 UTC if their browser never reported a timezone).

## How the timing works

Notifications are currently sent by one scheduled job a day. That becomes a job that runs **every 15 minutes**, and each run sends only to the devices whose chosen local time has just come round.

```text
every :00 :15 :30 :45  ->  send-daily
                            for each device:
                              local time now (device timezone)
                              == chosen time, and
                              not already sent today (local date)
                            -> push, mark sent for that local day
```

The "already sent today" guard is what keeps a reader from getting two verses if a run overlaps or retries, and it is measured in the reader's own local date so it rolls over at their midnight, not UTC midnight.

The verse-of-the-day is built once a day today at 09:45 UTC. Since readers can now be woken at 00:15 UTC, that build moves earlier and the send path falls back to resolving the verse on demand if the day's entry isn't there yet — so an early riser never gets an empty notification.

## Technical notes

- **Database migration** on `push_subscriptions`: add `send_hour` (0-23) and `send_minute` (0/15/30/45) with defaults, and `last_sent_day` (date) to replace the coarse `last_sent_at` guard. Backfill existing rows to 07:00 where a timezone is known, else 10:00 with timezone `UTC`. Table stays server-only — no new policies or grants, per the existing security memory.
- **`/api/public/push/subscribe`**: accept optional `hour` and `minute` in the Zod body, validate the minute to the 15-minute grid, and persist alongside the existing timezone. The client already sends `timezone` from `Intl.DateTimeFormat().resolvedOptions().timeZone`; that becomes required for scheduling and defaults to `UTC` when absent.
- **`/api/public/push/send-daily`**: select devices, compute each device's local `HH:MM` and local date with `Intl.DateTimeFormat` against its stored timezone, and filter to those matching the current 15-minute slot whose `last_sent_day` is not today. Keep the existing batching, 410-Gone pruning and failure-count logic; write `last_sent_day` alongside `last_sent_at` on success.
- **Cron migration**: reschedule `bible-atlas-send-daily-verse` to `*/15 * * * *` and move `bible-atlas-build-daily-verse` to run shortly before the earliest possible local send, keeping it idempotent per day.
- **`src/lib/push/subscribe.ts`**: extend `savePushPrefs` to carry hour/minute, and store the chosen time in `localStorage` so the picker shows the right value on return.
- **`src/components/reader/PushToggle.tsx`**: add the picker, presets and timezone line; reuse the existing busy/note states for feedback.

No change to what the notification contains, to the liturgical seasons, or to the mirrored daily-verse source.
