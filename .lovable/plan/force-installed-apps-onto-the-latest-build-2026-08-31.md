# Force installed apps onto the latest build

Today the installed app only learns about a new release when the browser happens to re-fetch the worker file and Workbox notices a byte difference. If that check is skipped or the shell HTML is replayed from cache, a returning reader can sit on an old build indefinitely — which is how devices ended up without the new translations. There is a "Refresh now" prompt, but it only appears when a waiting worker exists, so a stuck device never sees it.

Add an explicit version check that does not depend on the worker noticing anything.

## How it will work

1. Each build stamps its own build id into the client bundle, and the server exposes the current build id at a tiny always-fresh endpoint.
2. On launch, and whenever the app is brought back to the foreground (throttled to at most once every few minutes), the app asks that endpoint for the current build id.
3. If the served id differs from the one the running app was built with, it is definitively out of date:
   - ask the worker to check for an update,
   - if a new worker is waiting, activate it immediately and reload,
   - if no new worker appears within a few seconds, do a cache-bypassing reload of the page so the fresh shell HTML and bundles load anyway.
4. A one-shot session guard prevents any possibility of a reload loop: if a forced reload has already happened this session, the app stops and falls back to the existing "Refresh now" prompt instead.

Scoped to the real site only. The check is skipped in dev, in the Lovable preview, inside iframes, when offline, and while a Bible download is in progress — the same guards the update prompt already respects. Downloaded chapters, highlights and settings live in the device database and are untouched by the reload.

This makes the current "Refresh now" toast the polite path for readers already on a recent build, and the forced path the safety net for devices that fell far behind.

## Also worth noting

This fixes devices installed from `mybibleatlas.com`. Devices installed from the old `bibleatlas.lovable.app` are a separate origin with separate storage — the version check will keep them current on that origin, but moving them to the new domain still needs a reinstall. Tell me if you want a banner on the old domain nudging people to reinstall; that is not part of this plan.

## Technical notes

- `vite.config.ts`: the existing `BUILD_ID` constant becomes shared — injected into the client via `define` (e.g. `__BUILD_ID__`) as well as used for the precache `/` revision.
- New route `src/routes/api/public/build.ts`: returns `{ buildId }` as JSON with `Cache-Control: no-store`.
- New module `src/lib/pwa/version-check.ts`: fetches the endpoint with `cache: "no-store"`, compares to `__BUILD_ID__`, and runs the escalation (worker update → skip waiting → reload → hard reload fallback). Reuses `serviceWorkerAllowed()`, `ensureServiceWorker()` and `applyUpdate()` from the existing PWA modules; session-storage key guards against loops.
- `src/routes/__root.tsx`: start the checker alongside `registerOfflineWorker()` in the existing effect, with a `visibilitychange` listener.
- No backend, schema, or auth changes.
