# Add Instagram handle to the About page

Add a `@mybibleatlas` link with the Instagram logo to `/about` to drive social engagement.

## What gets built

- Add an Instagram call-to-action to the page header (next to the "Start reading" and "Explore maps" buttons), so it's visible high on the page where engagement is strongest:
  - The lucide-react `Instagram` icon + the text `@mybibleatlas`.
  - Styled as a muted bordered pill (matching the secondary "Explore interactive maps" button) so it reads as a tertiary action, not competing with the primary "Start reading" CTA.
  - Links to `https://www.instagram.com/mybibleatlas`, `target="_blank"`, `rel="noreferrer noopener"`, accessible label "Follow Bible Atlas on Instagram".
- Add the same Instagram link to the page footer row (next to the existing nav links) as an icon + `@mybibleatlas` text link, so it's reachable at the bottom too.
- No other About-page or routing changes.

## Technical notes

- Edited file: `src/routes/about.tsx`.
- Add `Instagram` to the existing `lucide-react` import on line 2.
- Reuses existing styling tokens (border, text-muted-foreground, hover:bg-muted); no new CSS or dependencies.
