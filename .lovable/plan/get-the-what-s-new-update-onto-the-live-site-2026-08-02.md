# Get the "What's new" update onto the live site

## What I checked on bibleatlas.lovable.app

- The live `/whats-new` page HTML does contain release 1.8.0 and the "Versioned release notes" entry, and the deployed JS chunk contains the newer localStorage keys (`bible-atlas:first-seen`, `bible-atlas:whats-new-dismissed`) and the footprint key `bible-atlas-push-prefs`.
- So a build with release-notes code is deployed, but it is not necessarily the newest one — frontend changes only go live when the project is published again, and the most recent edits were made after the last publish.
- The live service worker (`/sw.js`) precaches the app shell `/` with a hard-coded revision string (`bible-atlas-shell-v1` in `vite.config.ts`). Because that revision never changes between deploys, Workbox treats the cached shell as still valid, so a returning device can keep being served the previous HTML — which points at the previous JS bundles.

## Plan

1. **Publish the current project** so the latest reader changes (the sidebar/drawer "What's new" link, banner dismissal persistence, returning-reader backdating) are actually deployed.
2. **Stop the app shell from being pinned forever.** Replace the constant `revision: "bible-atlas-shell-v1"` for the `/` precache entry with a value that changes on every build, so each deploy invalidates the cached shell and returning devices download the new HTML instead of replaying the old one.
3. **Re-verify against the live URL after publishing**: fetch `/` and `/whats-new`, confirm the served HTML references the newly built asset hashes and that the reader chunk contains the "What's new" navigation entry.

## Technical notes

- `vite.config.ts`: `additionalManifestEntries` revision becomes build-unique (e.g. derived from `Date.now()` at config evaluation) so Workbox's precache diff detects a change each deploy. Everything else in the PWA config stays as is.
- No changes to `src/lib/whats-new.ts` or `src/lib/release-notes.ts` — that logic is already correct and already deployed.
- No backend, schema, or auth changes.
- Users already running the old worker will pick up the new one on their next visit (`skipWaiting` + `clientsClaim` are already enabled); it may take one reload for the swap to complete.
