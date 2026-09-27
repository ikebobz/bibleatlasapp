# Move "What's new" into the header, next to search

Right now the release-notes entry point lives inside the settings gear dropdown (and in the sidebar), where readers aren't finding it. Make it a first-class icon in the top bar instead.

## Changes

1. **New header button** in the reader top bar, placed immediately to the left of the search icon: a sparkles icon button labelled "What's new", linking to `/whats-new`, with the same unseen-count dot/badge already used elsewhere.
2. **Remove the "What's new" link from the settings dropdown**, and remove the unseen-count dot from the gear icon (the count now lives on the new header button). Highlights and Connections stay in settings.
3. **Sidebar / mobile drawer**: keep the existing `WhatsNewNavLink` entries as-is so the wording stays discoverable there too. (Say the word if you'd rather I remove those as well and keep only the header icon.)
4. **Analytics unchanged**: the header button fires the existing `nav_click` event, so reach reporting on `/admin/devices` keeps working.

## Technical notes

- All edits are in `src/components/reader/ReaderChrome.tsx`: add a compact `WhatsNewButton` (icon-only, `aria-label` includes the unseen count) next to `<SearchButton />` in the header's right-hand cluster, and delete the `/whats-new` `<Link>` block plus the badge span in `SettingsMenu`.
- Button styling matches the existing 8x8 rounded-full bordered icon buttons; badge uses the same primary dot pattern.
- After the change, publish so the live site picks it up.
