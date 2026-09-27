# Update prompts, offline readiness, QA checklist, iOS install signal

Four related pieces of work around the installed-app experience.

## 1. "Update available" prompt with safe background refresh

Today the service worker auto-updates and the page silently reloads when a new worker takes control. That can interrupt reading and, on a bad moment, flash a blank shell.

- Track the waiting worker instead of reloading blindly: when a new version is installed and waiting, show a small, brand-styled toast — "A new version of Bible Atlas is ready" with **Refresh now** and **Later**.
- **Refresh now** tells the waiting worker to activate and then reloads once.
- **Later** keeps reading uninterrupted; the prompt returns on the next visit, and the update applies naturally at the next cold start.
- Offline safety: the prompt never appears while the device is offline or while an offline Bible download is in progress, and downloaded chapters in the local database are untouched by an update (only the app shell/cache is refreshed).
- The existing one-shot reload guard stays, so no reload loops.

## 2. Offline readiness checklist on /install

A compact card on `/install` (and reused inside the reader's offline section) that checks, in order:

1. Browser supports offline mode
2. App is installed / running standalone (informational)
3. Service worker is registered and active
4. App shell is cached (verified against the cache storage)
5. KJV offline text is downloaded

Each row shows ready / not ready / not applicable, with a one-tap action when something is missing: "Enable offline" (registers the worker), "Download the Bible" (opens the existing offline download flow), or an explanation that offline only works on the published site, not in the editor preview. A "Re-check" button re-runs it.

## 3. QA checklist page

A new page at `/install/qa` (noindex) with a printable, step-by-step reproduction script for testing installs:

- iPhone Safari (iOS 17 and iOS 18), iPad Safari, Android Chrome, desktop Chrome/Edge
- In-app browsers (Instagram, Facebook, Gmail, X) — how to reach "Open in Safari"
- Update flow test: publish, reopen, confirm the update prompt and that a refresh keeps offline chapters
- Offline test: airplane mode, cold launch from the Home Screen icon, read a downloaded chapter
- A live diagnostics block showing the detected platform, browser, standalone state, worker state and cached-shell state so a tester can paste it into a bug report
- Expected result plus common failure notes for each step

Linked from `/install` under a small "Testing" link, not from main navigation.

## 4. Reliable install_completed signal on iOS

iOS fires no `appinstalled` event. Instead:

- On every load, compare current standalone state with a stored "was standalone" flag; the first time the app is seen running standalone, fire `install_completed` once and mark it permanently in local storage so it can never double-fire.
- Also listen to the `display-mode: standalone` media query change for in-session transitions.
- On Android/desktop, the native `appinstalled` event routes through the same once-only helper, so the event means the same thing everywhere.
- The event carries platform, browser and days-since-first-visit — no personal data.

## Technical notes

- New: `src/lib/pwa/update.ts` (waiting-worker tracking), `src/components/pwa/UpdatePrompt.tsx`, `src/lib/pwa/readiness.ts`, `src/components/install/OfflineReadiness.tsx`, `src/lib/pwa/install-signal.ts`, `src/routes/install.qa.tsx`.
- Edited: `src/lib/pwa/register-sw.ts` (expose the registration and waiting worker, stop the unconditional reload), `src/routes/__root.tsx` (mount the update prompt, call the install signal), `src/routes/install.tsx` (readiness card + QA link), `src/components/reader/InstallPrompt.tsx` (use the shared install signal), `src/lib/analytics/share-events.ts` (`install_completed`, `update_prompt_shown`, `update_applied`).
- Unchanged: manifest, Workbox caching strategy, offline KJV storage, push worker, sharing, audio player.

## Testing

Playwright covers: the update prompt renders and its buttons work against a simulated waiting worker; the readiness checklist reports each state correctly; `/install/qa` renders with live diagnostics; and the standalone signal fires exactly once across two loads. Real iOS 17/18 hardware behaviour still needs a manual pass after publishing — that's what the QA page is for.
