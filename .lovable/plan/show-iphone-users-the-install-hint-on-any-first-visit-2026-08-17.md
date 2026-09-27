# Show iPhone users the install hint on any first visit

Today the "Add to Home Screen" card only appears when someone lands on a shared link (`?s=share`) inside a chapter page. iPhone visitors arriving on the homepage, `/maps`, or `/concordance` never see it. This change makes the install hint site-wide, first-visit, and safe on browsers where installing isn't possible.

## What changes for users

- On any first visit — homepage, maps, concordance, a chapter — an iPhone visitor in Safari sees a small dismissible card: "Add Bible Atlas to your Home Screen" with the Share → Add to Home Screen steps.
- On Android/desktop Chrome the same card offers the real one-tap Install button (unchanged behaviour, just now available everywhere).
- The card appears once the page has settled (short delay), sits unobtrusively at the bottom of the screen rather than pushing the passage down, and disappears for good after "Not now" or after installing.
- Nothing shows when the app is already installed, or inside in-app browsers (Facebook, Instagram, Gmail, TikTok) where Add to Home Screen doesn't exist.
- Shared-link arrivals keep working exactly as now, just without a duplicate card.

## Technical notes

- `src/components/reader/InstallPrompt.tsx`
  - Drop the `show`-gated `?s=share` requirement; the component decides for itself.
  - Add an in-app browser check (user-agent match for FBAN/FBAV/Instagram/Line/GSA/TikTok and similar) and keep the existing standalone check.
  - Keep the `bible-atlas:install-dismissed` localStorage key so anyone who already dismissed it stays dismissed.
  - Restyle from an inline `<aside>` block to a fixed bottom sheet (`fixed inset-x-0 bottom-0`, safe-area padding, z-index above the reader, max-width centred on desktop) so it no longer displaces chapter text.
  - Keep existing `trackShare` analytics events (`install_prompt_shown`, `install_accepted`, `install_dismissed`) and add the arrival source (share vs organic) so the admin dashboard can still tell them apart.
- `src/routes/__root.tsx` — render `<InstallPrompt />` once inside the root layout, next to `<Outlet />`, so it covers every route.
- `src/components/reader/ChapterReader.tsx` — remove the per-chapter `<InstallPrompt show={...} />` render and the now-unused `sharedArrival` pass-through to `ChapterBody`; keep the `link_opened` share tracking.

No backend, routing, manifest, or Scripture-fetching changes.
