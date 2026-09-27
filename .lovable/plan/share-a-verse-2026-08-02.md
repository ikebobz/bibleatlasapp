# Share a verse

Add sharing to the verse menu that already appears when you tap a verse number, so any verse can be sent to WhatsApp, X, email, or anywhere else — with a link back to that exact verse in Bible Atlas.

## What the user gets

- Tap a verse number → the existing highlight menu now has a **Share** action next to Copy.
- On phones (and any browser with native sharing), Share opens the OS share sheet — WhatsApp, Messages, Mail, etc.
- On desktop, or where native sharing is unavailable, a small share sheet appears with: WhatsApp, X, Telegram, Email, and **Copy link**.
- Shared payload: the verse text, the reference, and a deep link, e.g.
  `"Be careful for nothing…" — Philippians 4:6 https://bibleatlas.lovable.app/philippians/4?v=6`
- The existing Copy action stays, unchanged.
- Opening a shared link already works today: `?v=` scrolls to and highlights that verse.

## Technical notes

- New `src/lib/share.ts`: builds the verse deep link (`${origin}/${book}/${chapter}?v=${verse}`), the share text, and a `shareVerse()` helper that uses `navigator.share` when available and falls back to returning `false` so the caller can show the manual sheet.
- New `src/components/reader/ShareSheet.tsx`: small popover listing WhatsApp (`https://wa.me/?text=`), X (`https://twitter.com/intent/tweet?text=`), Telegram (`https://t.me/share/url=`), Email (`mailto:`), and Copy link. Uses existing popover/border/token styling from `HighlightMenu`, no hardcoded colors.
- `HighlightMenu.tsx`: add a `Share` button (lucide `Share2`) in the footer row beside Copy; accepts an `onShare` prop. Layout stays a single row (Share / Copy / Remove).
- `Verse.tsx`: passes book, chapter, verse, text and reference into the share handler; tries `shareVerse()` first, opens `ShareSheet` if it returns false or is rejected.
- Also add the same Share action to each card on the `/highlights` page, reusing the same helper.
- No backend, no schema changes; everything is client-side.
