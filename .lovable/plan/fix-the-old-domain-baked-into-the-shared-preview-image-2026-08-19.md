# Fix the old domain baked into the shared preview image

## What's wrong

The dynamic verse card already reads "mybibleatlas.com", but the static fallback artwork in `public/og/` still has **bibleatlas.lovable.app** printed into the image itself. Whenever a platform (or a failed render) falls back to that file — and for the site-wide default preview — the old domain is what people see.

Confirmed in `public/og/default-card.jpg`: the parchment card's footer line reads "bibleatlas.lovable.app". `public/og/verse-card.jpg` (and its PNG twin) is the older sibling used by legacy links and needs the same check and treatment.

## The fix

- Regenerate `public/og/default-card.jpg` with the identical design — parchment map ground, compass rose, "BIBLE ATLAS" lockup, "Read the Bible with context & maps" — with the footer line reading **mybibleatlas.com**.
- Do the same for `public/og/verse-card.jpg` / `verse-card.png` if they carry the old domain, so older shared links also unfurl with the right address.
- Keep filenames, dimensions (1200x630) and paths unchanged, so every existing metadata reference, cached link and fallback path keeps working with no code change.

## Not touched

Dynamic card rendering, `share.ts`, metadata, redirects, and everything else stays exactly as it is.

## Validation

- Visually inspect each regenerated image at full size and confirm the footer reads mybibleatlas.com and nothing else changed.
- Confirm the files still serve at their existing URLs and the verse endpoint's fallback path still returns an image.
- Note for you: platforms cache previews, so already-shared links may keep showing the old card until the platform re-scrapes; a link preview debugger forces a refresh.
