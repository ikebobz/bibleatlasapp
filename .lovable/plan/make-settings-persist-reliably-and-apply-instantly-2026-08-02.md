# Make settings persist reliably and apply instantly

## What's wrong today

Reading through the settings and notification code, three real gaps exist:

1. **Settings load one render too late.** The settings store starts from hardcoded defaults and only reads your saved values in an effect after the page has already rendered. On every reload you briefly get the default theme, font size, line height and translation — the theme flashes, and the reader can start fetching the default KJV text before switching to your saved version.
2. **A delivery time picked while notifications are off is not saved.** Choosing a time shows "Saved for 7:00 AM — turn Daily verse on to start", but nothing is actually written to storage in that path. Reload, and the picker snaps back to 7:00 AM.
3. **No cross-tab / same-device sync.** Two open tabs (or the settings menu and reader) can drift apart, since changes are never broadcast.

## What will change

- Settings are read from storage **before the first paint**, so your theme, font scale, line spacing, quiet mode, original-languages layer and translation are already correct when the page appears — no flash, no wrong-version fetch.
- The dark/light class is applied by a tiny script in the page head so the very first frame is already themed.
- Picking a delivery time always persists immediately, whether Daily verse is on or off; when it's on, the server copy is updated too.
- The notification toggle reflects real state on load: saved time, on/off from the actual push subscription, and permission state.
- Settings changes broadcast to other open tabs and update instantly everywhere.

## Technical notes

- `src/components/reader/settings.tsx`: replace the effect-based hydration with a lazy `useState` initializer that reads `bible-atlas:settings` (guarded for SSR so server render still uses defaults), keep the write-on-update behaviour, and add a `storage`-event listener to merge external changes. Apply the `dark` class synchronously with `useLayoutEffect` on the client.
- `src/routes/__root.tsx`: add a small inline pre-hydration script that reads the same key and sets `documentElement.classList.dark` plus font-scale CSS variables, eliminating the theme flash.
- `src/lib/push/subscribe.ts`: export `writePushTime` (or a `savePushTime` wrapper) so the time can be persisted without a subscription.
- `src/components/reader/PushToggle.tsx`: call that in `chooseTime` for both the on and off branches; keep the existing server sync when on. Re-read the stored time on mount (already done) and leave the Android permission-on-tap flow untouched.
- No database or server changes; the per-device row on the server is still written on enable and on time change while enabled.

## Verification

Set a non-default theme, font size, translation and notification time, reload, and confirm each is correct on the first painted frame; repeat with a second tab open to confirm live sync.
