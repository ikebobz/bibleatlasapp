# Settings icon and scrollable submenu

## Goal
Replace the current settings trigger (the letter "T" / Type icon) in the reader header with a proper settings gear icon, and make the settings submenu scrollable on small screens so it stays usable without overflowing the viewport.

## Changes

### 1. Settings trigger icon
- File: `src/components/reader/ReaderChrome.tsx`
- Import `Settings` from `lucide-react` alongside the other icons.
- In `SettingsMenu`, replace the `<Type ... />` icon inside the trigger button with `<Settings className="h-3.5 w-3.5" />`.
- Keep the existing `aria-label="Reading settings"` and styling.

### 2. Scrollable submenu on small screens
- File: `src/components/reader/ReaderChrome.tsx`
- Update the settings dropdown panel (`SettingsMenu`):
  - Add `max-h-[70vh] overflow-y-auto` so the menu scrolls internally when content exceeds the viewport.
  - On very small screens, prevent the menu from running off the right edge: make it span most of the screen width with a small margin (`left-4 right-4 w-auto sm:left-auto sm:right-0 sm:w-64`) or equivalent.
  - Keep the existing `bg-popover`, border, shadow, padding, and section spacing.

## Verification
- Build/typecheck passes.
- Open the reader on a small viewport; tap the new gear icon; the settings panel opens and can be scrolled if its contents are taller than the screen.
- No other functionality (version menu, offline toggle, push toggle, etc.) changes.
