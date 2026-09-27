# Bible Atlas favicon & PWA icon cleanup

The browser tab still shows the default Lovable icon because `public/favicon.ico` is the template's icon, and it is the only thing `__root.tsx` links as `rel="icon"`. The Bible Atlas book-and-compass icon already exists as `public/app-icon-192.png` / `public/app-icon-512.png` and is used for the Home Screen and PWA manifest.

## Approach

Reuse the existing Home Screen icon as the single source of truth. No new visual identity, no design changes.

1. Derive small square PNGs from `public/app-icon-512.png`:
   - `public/favicon-32.png` (32x32)
   - `public/favicon-16.png` (16x16)
   - `public/apple-touch-icon.png` (180x180, opaque background, correct padding for iOS)
   - Replace `public/favicon.ico` with a multi-size ICO (16/32/48) generated from the same source, so bookmarks and legacy browsers stop serving the Lovable mark.
2. Update the `links` array in `src/routes/__root.tsx`:
   - `rel="icon"` PNG entries for 32 and 16, plus the ICO fallback
   - `rel="apple-touch-icon"` pointing at the new 180x180 asset (currently 192x192, which iOS downsizes)
   - keep the manifest and stylesheet links untouched
3. Update `public/manifest.webmanifest`:
   - keep `name`, `short_name`, `theme_color` (#7a4a24), `background_color` (#f6efe4) as-is — they are already Bible Atlas branded
   - add a 192x192 maskable entry alongside the existing 512 maskable so Android launchers have both sizes
4. Sweep the codebase for any remaining user-facing Lovable branding in icons/metadata (`rg` for `lovable` in `public/`, `src/routes`, manifest, head tags). Development tooling and Lovable error-reporting internals stay untouched.

## Notes

- Titles, Open Graph, Twitter cards, structured data, sitemap and the mybibleatlas.com domain work stay exactly as they are; the tab title already reads "Bible Atlas — Read the Bible with Context & Maps".
- The service-worker precache glob already covers `png` and `ico`, and the build ID changes per deploy, so installed PWAs pick up the new icons on their next update.
- Browsers cache favicons aggressively — after publishing, a hard reload or cache clear may be needed to see the change locally. Already-installed Home Screen icons on iOS keep the icon captured at install time until reinstalled (that icon is already correct).

## Validation

- Verify the generated PNG/ICO files render the Bible Atlas book icon (view them directly).
- Load `/`, `/about`, and a verse route in a headless browser and assert the emitted `<link rel="icon">` / `apple-touch-icon` hrefs resolve with 200 and point at the new assets.
- Confirm `/manifest.webmanifest` still parses and lists both maskable sizes.
- Run the existing test suite and the domain build guard to confirm nothing else regressed.
