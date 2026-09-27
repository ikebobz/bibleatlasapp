# Web Push Notifications for Bible Atlas

Yes — web push works on Chrome, Edge, Firefox and Android, and on iOS/iPadOS 16.4+ once the app is added to the Home Screen. Notifications arrive even when the browser is closed, as long as the OS lets the browser run in the background. Bible Atlas already ships as an installable PWA, so this slots in cleanly.

## What readers get

- A "Daily verse" toggle in the reader settings menu. Turning it on asks for notification permission and registers that device.
- One notification per day at a fixed time for everyone (10:00 UTC by default, adjustable in one place).
- Tapping the notification opens Bible Atlas directly at that chapter, scrolled to the verse.
- During church seasons the daily notification carries the seasonal reading instead: Advent, Lent, Holy Week, Eastertide, and Pentecost each get a themed verse for every day of the season, with the season name shown in the notification.
- A settings link to unsubscribe, and a "send me a test" button so people can confirm it works.

## Daily verse source

The Joseph Prince "Daily Grace Inspirations" page publishes a title and a Scripture reference each day. The devotional prose itself is copyrighted by Joseph Prince Ministries, so Bible Atlas will not reproduce it. Instead:

- A daily job reads today's entry and keeps only the **title and the Scripture reference** (e.g. `Romans 16:20`) — references are facts, not protected text.
- The notification body shows that verse in Bible Atlas's own public-domain translation (the reader's chosen version: KJV, WEB or ASV).
- The notification card includes a "Read the devotional" link back to the original josephprince.org page, so credit and traffic go to the source.
- If the feed is unavailable, the job falls back to a curated verse list so a notification still goes out.

Seasonal days override the mirrored reference with the season's own reading.

## Technical approach

**Push transport** — VAPID web push (no Firebase). Generate a VAPID key pair, store the private key as a backend secret, expose the public key to the client.

**Service worker** — the existing `vite-plugin-pwa` `generateSW` build gains a small `importScripts`-free custom injection point (`injectManifest` is not needed): add `push` and `notificationclick` handlers via the plugin's `importScripts` option pointing at a hand-written `public/push-sw.js`. This is a messaging worker, kept outside the offline-cache guards, and it is exempt from the no-service-worker preview rule. Registration still refuses in preview/iframe/dev via the existing wrapper.

**Database (Lovable Cloud)** — new public tables with GRANTs and RLS:
- `push_subscriptions` — endpoint (unique), p256dh, auth, translation preference, timezone, created/last-seen, failure count. Anonymous devices, so `anon` may INSERT and DELETE by endpoint only; no SELECT to `anon`.
- `daily_verse` — date, source (`mirror` | `seasonal` | `fallback`), title, book, chapter, verse, source_url. One row per day, seeded with the current liturgical calendar entries.

**Server routes** (`src/routes/api/public/*`, all verifying a shared cron secret header):
- `POST /api/public/push/subscribe` and `/unsubscribe` — device registration (public, validated with Zod, no PII returned).
- `POST /api/public/push/build-daily` — scrapes today's reference, resolves seasonal override, writes `daily_verse`.
- `POST /api/public/push/send-daily` — batches subscriptions, signs VAPID JWTs with Web Crypto, POSTs to each endpoint, prunes 404/410 endpoints.

Both cron routes are driven by `pg_cron` + `pg_net` against the stable project URL. Web push signing uses Web Crypto directly (Worker-compatible); no Node-only push library.

**Client** — `src/lib/push/subscribe.ts` handles permission, `pushManager.subscribe`, and posting the subscription; a `PushToggle` in `ReaderChrome.tsx` settings; graceful "not supported" copy on iOS Safari when the app is not installed to the Home Screen.

## Notes

- iOS requires Home Screen installation before permission can even be requested — the toggle will explain this rather than fail silently.
- Notification permission is only requested on an explicit tap, never on page load.
- Mirroring is limited to reference + link. If you would rather not depend on an external site at all, say so and the daily verse becomes a fully curated in-app calendar instead.
