# Fix: Share button does nothing

## What's wrong

Confirmed by running the share call live in the app: the browser reports that a native share sheet exists (`navigator.share` is present), but the actual call is rejected with `NotAllowedError: Permission denied`. Our share code treats *any* rejection as "the user shared it or cancelled" and stops there — so no OS sheet appears, no in-app share menu appears, and the click looks dead.

This hits every context where the OS sheet is blocked or unavailable despite the API existing: the Lovable preview frame, embedded webviews, and desktop browsers that expose the API without permission.

## The fix

1. **Distinguish "user cancelled" from "share failed."** In `src/lib/share.ts`, `shareVerse` will only report success when the share actually resolves, or when the rejection is a genuine user cancel (`AbortError`). Any other rejection — `NotAllowedError`, `NotSupportedError`, `TypeError`, security errors — reports failure so the caller falls back.
2. **Pre-check capability.** Before attempting the OS sheet, check `navigator.canShare(payload)` when available and skip straight to the in-app sheet when it returns false (this is exactly what the live check returned).
3. **Always show something.** In `src/components/reader/Verse.tsx`, the fallback opens the existing `ShareSheet` (WhatsApp, Telegram, Facebook, X, LinkedIn, Discord, Email, SMS, Copy link) anchored to the verse number. Same fallback wiring for the share entry points on the highlights page and the Atlas panel, so no path can silently no-op.
4. **Guard the anchor.** If the anchoring rect is missing for any reason, the sheet still opens centred rather than not rendering.

## Technical notes

- `shareVerse` returns `false` on non-`AbortError` rejections; only `AbortError` (and a clean resolve) count as handled.
- `navigator.canShare` gate added before `navigator.share`, wrapped in try/catch since some engines throw on it.
- `Verse.tsx` keeps the captured `DOMRect` from the highlight menu; the fallback path already exists and simply gets reached now.
- Verified after the change by driving the reader in a browser: tapping a verse number then Share must render the share menu, and the analytics events (`share_opened`, `share_sent`) must still fire.

No changes to Scripture fetching, highlighting, deep-link format, or the preview-card endpoint.
