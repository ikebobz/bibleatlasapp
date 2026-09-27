# iOS Daily Verse Troubleshooting Card

## Goal
Add a dedicated, visually distinct iOS troubleshooting card inside the Daily verse settings panel that explains why push may not work on iPhone/iPad and gives the exact steps to enable it via Safari "Add to Home Screen".

## Current state
- `PushToggle.tsx` already shows an inline message for the `ios-browser` unsupported state.
- `diagnostics.ts` already detects iOS, third-party browsers, and standalone mode.
- The user still reports confusion, especially on published iOS traffic, so a richer card with iconography and step-by-step instructions is needed.

## Proposed changes

### 1. New `IosPushHelp` component
Create a small, reusable card component (e.g. in `src/components/reader/PushToggle.tsx` or a new `src/components/reader/IosPushHelp.tsx`) that renders only when the device is iOS and not in a working push state.

Content:
- Headline: "iPhone / iPad setup"
- Explanation: Apple only allows web push for sites added to the Home Screen from Safari.
- Step list:
  1. Open **bibleatlas.lovable.app** in **Safari**.
  2. Tap the **Share** button.
  3. Scroll down and tap **Add to Home Screen**.
  4. Launch Bible Atlas from the new icon.
  5. Return to Settings → Daily verse and turn it on.
- Add a "Copy link" button so users can easily paste the URL into Safari.
- Show a warning when the browser is Chrome/Firefox/Edge on iOS explaining those browsers cannot receive push even after adding to Home Screen.

### 2. Integrate into `PushToggle`
- Render the card inside `PushToggle` whenever `isIos()` is true and the current status is not `enabled`.
- Keep the existing inline text for `ios-browser` state, but also show the card below it for persistent visibility.
- Ensure the card is keyboard/screen-reader friendly (ordered list, accessible buttons).

### 3. Styling
- Use existing semantic tokens (`border`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `text-primary`).
- Add a subtle Safari icon / share icon visual using `lucide-react` icons (`Share`, `Smartphone`, `Safari` if available; otherwise `Globe` + `Share`).
- Make the card collapsible on very small screens so it does not push the time picker out of view.

### 4. Verification
- Test the card renders on iOS user-agent strings via Playwright or browser dev tools.
- Confirm it does not appear on Android, desktop, or when Daily verse is already enabled.
- Confirm no layout shift hides the time picker on small screens.
