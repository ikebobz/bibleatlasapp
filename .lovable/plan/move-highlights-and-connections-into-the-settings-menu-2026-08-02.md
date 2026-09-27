# Move Highlights and Connections into the settings menu

## What changes

The reader header currently shows separate "Highlights" and "Connections" buttons next to search, the version picker and the settings gear. Those two move inside the settings menu, freeing header space (especially on phones, where they sit as icon-only pills today).

- Remove both header links.
- Add a small navigation group at the top of the settings dropdown: "Highlights" and "Connections", each with its existing icon, as full-width rows matching the other menu rows.
- Tapping either navigates to its page and closes the menu.
- Everything else in the menu (text size, line spacing, quiet mode, original languages, appearance, offline, daily verse) stays in place and order below the new group, separated by a divider.

## Technical notes

- `src/components/reader/ReaderChrome.tsx`: delete the two `<Link>` elements in the header action row; add them inside `SettingsMenu`'s dropdown as the first block, using `Highlighter` and `Waypoints` (imports already present) and calling `setOpen(false)` on click. The menu already scrolls at `max-h-[70vh]`, so the extra rows stay reachable on small screens.
- No route, data or behaviour changes.
