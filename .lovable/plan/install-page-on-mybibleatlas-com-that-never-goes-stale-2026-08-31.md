# Install page on mybibleatlas.com that never goes stale

## What already exists

- `/install` with device tabs (iPhone, iPad, Android, Desktop), illustrated Safari Share steps, offline readiness checklist and an install FAQ.
- Apple Touch Icon (`/apple-touch-icon.png`, 180x180), manifest with 192/512 any + maskable icons, `apple-mobile-web-app-title`, `viewport-fit=cover`.
- A forced version check that asks `/api/public/build` on launch and foreground and escalates worker update -> activate -> cache-busting reload.

So the guide itself is largely built. The gap the request names — "installs from there never go stale" — is that nothing today makes sure the visitor is actually on `mybibleatlas.com` when they install. Apps added to the Home Screen from `bibleatlas.lovable.app` (or the preview host) keep launching that old origin forever, which is exactly how users ended up missing the new translations.

## What I'll add

**1. Canonical-origin guard on `/install`**
If the page is opened on any host other than `mybibleatlas.com`, show a prominent card above the steps: "You're not on the official address — installing from here will leave you on an old version." With a big "Open mybibleatlas.com" link (same path) and a copy-link button. The device steps stay visible but visibly de-emphasised until the visitor moves.

**2. Wrong-origin warning inside the installed app**
When the app is running standalone from a non-canonical origin, show a one-time, dismissible notice explaining that the icon was added from the old address, and how to fix it: delete the icon, open mybibleatlas.com in Safari/Chrome, add it again — with a warning that highlights and reading position stored on the old address won't carry over.

**3. Freshness panel on `/install`**
A small "You're running build X, latest is Y" row using the existing `/api/public/build` endpoint, with a "Get the latest version" button that triggers the existing forced-update path. Makes staleness visible and fixable in one tap instead of invisible.

**4. Icon and step polish**
- Show the real Apple Touch Icon at Home Screen size in the iOS steps, so users can confirm the icon they'll get looks right.
- Add an explicit step 0 for iOS: "Make sure the address bar reads mybibleatlas.com."
- Keep every existing tab, FAQ entry and the offline checklist unchanged.

**5. Discoverability**
Link `/install` from the settings menu and the install banner (banner already links it), and confirm `/install` is in the sitemap so it can be shared and found directly.

## Technical notes

- New helper `src/lib/pwa/origin.ts`: `isCanonicalOrigin()` comparing `window.location.host` to `SITE_HOST` from `src/lib/site.ts`, plus a `canonicalInstallUrl()` builder. Preview/dev hosts are treated as "not canonical but don't nag" so the editor preview stays clean.
- Edited: `src/routes/install.index.tsx` (origin card, freshness panel, icon preview), `src/components/install/InstallGuide.tsx` (iOS step 0 + icon preview), `src/routes/__root.tsx` (mount the wrong-origin standalone notice).
- New component `src/components/install/WrongOriginNotice.tsx`, dismissal stored under `bible-atlas:wrong-origin-dismissed`.
- Reuses `/api/public/build` and `src/lib/pwa/version-check.ts`; no changes to the service worker, manifest, offline storage or the reader.

## Validation

- Playwright against emulated iPhone Safari, Android Chrome and desktop: `/install` renders each tab, the icon preview loads, and the freshness row resolves.
- Simulate a non-canonical host and assert the warning card and standalone notice appear, and that they stay hidden on `mybibleatlas.com`.
- Run the existing test suite and the domain build guard.
