# Verify and fix admin unlock on the live site

## What I verified

- Preview build (current code): entering `Jesus` on `/admin/devices` unlocks immediately, no manual refresh. The dashboard renders (15 registered devices, stats panels).
- Live site `bibleatlas.lovable.app/admin/devices`: same passcode leaves the lock screen showing. The `atlas_admin` session cookie is set and no console errors appear, so the login round-trip runs, but the deployed page still renders locked.

The current source already contains the post-login `window.location.reload()` and the resilient session check. The live deployment does not reflect that code — the published build is older than the fix.

## Plan

1. Republish the project so the live site serves the current build.
2. Re-run the live check: load `/admin/devices`, enter `Jesus`, confirm the dashboard appears with no manual refresh, and confirm the session survives a reload.
3. If the live site still fails after publishing, investigate the deployed environment instead of the code: confirm `SESSION_SECRET` (32+ chars) and the `admin_credentials` version row resolve in production, using the server logs from the failed request.

## Technical notes

- Session: httpOnly `atlas_admin` cookie, sealed with `SESSION_SECRET`, `sameSite: lax`, `secure` when served over HTTPS, 8h max age.
- `isAdminSession()` also compares the cookie's credential `version` against `admin_credentials`; a mismatch logs out. A read failure keeps the session.
- No source changes are expected in step 1 — this is a deploy-state fix, not a code fix.
