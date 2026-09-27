# Daily Verse status indicator

Make the Daily Verse control always say exactly what state it is in and what the reader can do next, instead of appearing to do nothing when activation fails.

## Status model

One explicit status drives the whole panel:

| Status | When | What the user sees |
| --- | --- | --- |
| Checking | On mount, while support and existing subscription are resolved | Grey dot, "Checking this device…" |
| Not supported | Browser lacks push, iOS not installed to Home Screen, or preview has no service worker | Amber dot, "Not supported here" + the specific reason and fix |
| Blocked | Notification permission is denied | Amber dot, "Blocked in browser settings" + per-browser unblock steps |
| Disabled | Supported, permission not denied, no active subscription | Grey dot, "Off" |
| Subscribing | During permission prompt, worker startup, subscribe, and backend save | Spinner, live step text ("Asking permission…", "Starting notification service…", "Registering this device…", "Saving your settings…") |
| Enabled | Browser subscription exists and the backend confirmed it | Green dot, "On — next verse at 7:00 AM, Europe/London" |
| Error | Any step failed | Red dot, plain-language cause + a Try again button |

## Actionable messages

Each failure maps to a concrete instruction rather than a generic message:

- Permission denied: name the exact menu path for Chrome/Android, Safari/macOS and desktop Chrome, then "reload and try again".
- iOS not installed: "Tap Share, then Add to Home Screen, open Bible Atlas from your Home Screen, and turn this on there."
- Service worker never became active: "Notifications only work on the published site. Reload bibleatlas.lovable.app and try again."
- Browser subscribe failed: show the underlying reason (e.g. push service unreachable) plus Try again.
- Backend save failed: "Your browser is ready but we couldn't save this device — try again in a moment," with the returned error code shown small for support.

Every error state keeps a Try again button that re-runs activation from the top; nothing silently returns to Off.

## Diagnostics for support

Below the panel, a small collapsible "Device details" section shows permission value, service worker state, subscription present yes/no, endpoint host, timezone and chosen time, with a Copy button. This is what a user can paste when reporting that it still won't turn on.

## Technical notes

- Replace the loose `on` / `busy` / `note` state in `src/components/reader/PushToggle.tsx` with a single `status` union plus `detail` string; keep the existing tap-time permission request so Android Chrome retains user activation.
- Extend `EnableResult` in `src/lib/push/subscribe.ts` with a `step` field (`permission | worker | subscribe | save`) so the UI can report where it stopped, and add an optional `onStep` callback so `enableDailyVerse` can stream progress into the Subscribing state.
- Add a `permissionState()` helper and reuse `pushAvailability()` to derive Not supported / Blocked without duplicating checks.
- No backend or schema changes; `/api/public/push/subscribe` error codes already returned are surfaced verbatim in the error detail.
