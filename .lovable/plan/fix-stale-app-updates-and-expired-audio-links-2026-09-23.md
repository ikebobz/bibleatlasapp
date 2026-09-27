# Fix stale app updates and expired audio links

## What I found

**1. Missing updates (top-left menu still showing, no Law/History groups)**
The live site already has the new version. It has the grouped book picker and no top-left menu. Your phone and laptop are still running an older copy saved on the device. The app only swaps to a new version after you tap "Update" on the prompt. If you never see or tap that prompt, the old copy stays, so each device can be several releases behind.

**2. Philemon audio fails on the laptop**
The audio host gives out temporary links that stop working after about 12 hours. We save each link for 24 hours so we don't ask for it again and again. So for up to 12 hours a day, readers get a Philemon (WEB) link that has already expired. It isn't a laptop problem. The saved Philemon link expired last night at 23:42 UTC and is still being handed out. Your phone probably got a working link earlier, or still had one in memory. Any chapter can hit this, not only Philemon.

## Permanent fix

**Updates reach everyone**
- When a new version arrives, apply it the next time you open the app or return to the tab. It never swaps in the middle of reading a chapter.
- If a device is more than one release behind, update it automatically on the next page change and show a small "Updated to 2.x" note.
- The "Update" prompt stays for people reading right now, but nobody can get stuck on an old version anymore.
- Show the current version number in Settings, so you can check which version a device is running.

**Audio links never expire mid-use**
- Save each audio link only until 10 minutes before its own expiry time, not for a flat 24 hours.
- The server throws away any saved link that has already expired and fetches a fresh one.
- If a track still fails to load, the player asks for a fresh link once and tries again before showing an error.
- Clear the expired saved links that exist today.

## Checks
- Tests: an expired saved link is never returned, and the save time follows the link's expiry.
- Play Philemon, Jude and John 3 (WEB and NIV) on laptop and phone widths.
- Simulate an older installed version and confirm it updates by itself on the next visit.
- Release as 2.16.1.

## Technical details
- `audio-bible.server.ts`: pass `ttlMs = min(24h, expiresAt*1000 - now - 10min)` to `cachedCall`. Mark results within 10 minutes of expiry as not cacheable, and check `expiresAt` when reading from the cache.
- `AudioPlayer.tsx`: on an `<audio>` `error` event, refetch once with a cache-bypass flag, then play.
- One-off SQL: delete the `api-bible` / `audio` gateway cache rows.
- PWA: in `src/lib/pwa/update.ts`, when a waiting worker exists at startup or on `visibilitychange`→visible with no active reading interaction, post `SKIP_WAITING` and reload. Keep `skipWaiting: false` in the Workbox config so switching stays under our control. Show `BUILD_ID`/version in Settings.
