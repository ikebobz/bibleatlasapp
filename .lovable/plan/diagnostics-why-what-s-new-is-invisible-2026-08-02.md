# Diagnostics: why "What's new" is invisible

## What I checked

I opened the live reader, clicked the settings gear, and inspected the rendered menu and stored state.

- The menu does render the link: `/whats-new | What's new`, above Highlights and Connections.
- Stored state on this device: `bible-atlas:first-seen = 2026-08-02`, `bible-atlas:last-seen-release = 1.8.0`.
- With last-seen already at the newest release, the unseen count is 0 — so no dot on the gear, no badge on the menu row, no banner above the text.

So the link exists, but nothing points to it. Two concrete causes.

## Cause 1 — returning readers are misclassified as brand-new

The visit tracker only started writing `first-seen` when the release-notes system shipped. Any reader who used Bible Atlas before that has no `first-seen` key and no `last-seen` key, so on their next load the code decides "brand-new device", silently stamps the newest version as already seen, and suppresses every indicator forever. Exactly the users who need "What's new" are the ones guaranteed never to be told about it.

## Cause 2 — the entry point is buried

Even with a working count, the only path is: notice a small dot on a gear icon, open the dropdown, read the first row. On a phone the gear sits among search and version controls; there is no persistent, obvious surface for it.

## Fix

1. **Stop misclassifying existing readers.** Treat a device as brand-new only when it has no other Bible Atlas footprint at all. If any prior state exists (saved reading position, highlights, settings, offline chapters, translation choice), backdate their last-seen to the release before the notes system and let the real unseen count apply — so they get the badge and banner once, not silence.
2. **Make the banner reliable.** Keep the slim banner above the text for anyone with unseen items, and remember dismissal per version in `localStorage` (currently dismissal is component state only, so it reappears every reload — and disappears without ever being marked seen).
3. **Add a visible entry point.** Put a "What's new" item with its count in the mobile books drawer and at the bottom of the desktop sidebar, so it is reachable without opening the gear menu.
4. **Mark as seen on read.** Visiting `/whats-new` clears the count and dismisses the banner across surfaces.

## Technical notes

- `src/lib/whats-new.ts` — rework first-visit detection to probe existing Bible Atlas `localStorage` keys before deciding; add versioned banner-dismissal helpers.
- `src/components/reader/ReaderChrome.tsx` — persist `WhatsNewBanner` dismissal, add the sidebar and drawer entries with count badges.
- `src/lib/release-notes.ts` — add a constant for the pre-notes baseline version used when backdating existing readers.
- No backend or schema changes.
