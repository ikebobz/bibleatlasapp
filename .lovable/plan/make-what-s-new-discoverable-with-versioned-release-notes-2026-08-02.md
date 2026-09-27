# Make "What's new" discoverable with versioned release notes

Today the What's new page exists but is hidden inside the settings gear menu, so returning readers never notice it. This adds a real release-notes system: each batch of changes gets a version and date, and the app tracks which version each device has already seen.

## What readers will see

1. **A "New" dot on the settings gear** whenever there are releases newer than the last one this device viewed. The same dot appears on the What's new item inside the menu.
2. **A slim dismissible banner** at the top of the reader after an update: "3 new features since your last visit — See what's new". Tapping opens the release notes; dismissing marks everything as seen. It never shows on a device's very first visit (new users aren't "returning").
3. **A rebuilt /whats-new page grouped by release**, newest first: version number, date, a one-line summary, then the individual items. Everything released since the device's last visit sits under a clear "New since your last visit" divider, with older releases below it.
4. Opening the page marks the newest version as seen, so the dot and banner disappear.

## Release history

The existing feature list is reorganised into dated versions, newest first (Full canon and reader basics as v1.0, then maps/artifacts/economy, threads and highlights, search and original languages, offline mode and settings persistence, version switcher with KJV default, daily verse notifications with time picker and diagnostics, and the current release covering the release-notes system itself).

## Technical notes

- New `src/lib/release-notes.ts`: a typed `RELEASES` array (`version`, `date`, `summary`, `items[]` with icon name, title, description, optional link) plus helpers `latestVersion()`, `releasesSince(version)`.
- New `src/lib/whats-new.ts` (client-only): reads/writes `bible-atlas:last-seen-release` in localStorage alongside the existing settings keys, exposes a `useWhatsNew()` hook returning `{ unseenCount, isFirstVisit, markSeen }`. Reads happen in `useEffect`/after hydration to avoid SSR mismatch, matching the pattern in `src/components/reader/settings.tsx`.
- `src/routes/whats-new.tsx`: rewritten to render from `RELEASES` with the "since your last visit" divider; calls `markSeen()` on mount. Keeps its existing head metadata.
- `src/components/reader/ReaderChrome.tsx`: unread dot on the gear button and the What's new link; new `WhatsNewBanner` rendered above the chapter content.
- No backend changes; state is per-device in localStorage.
