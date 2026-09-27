# Remove the admin lock screen

Open `/admin/devices` directly — no passcode, no session cookie.

## What changes

- Drop the session check from all four admin data functions (`listPushDevices`, `getWhatsNewStats`, `getShareStats`, `getOpsHealth`). Each returns `{ locked: false, ... }` always, so the existing panels render unchanged.
- Remove `unlockAdmin` / `lockAdmin` and the passcode form, error states, and "Lock" button from `src/routes/admin.devices.tsx`.
- Keep `maskPushEndpoint` in `gate.server.ts` (endpoints stay masked); remove the passcode/session helpers.
- Page stays `noindex, nofollow`.
- Secrets `ADMIN_PASSCODE` and `SESSION_SECRET` are left in place, unused, so the lock can be restored later.

## Trade-off

Anyone who knows the `/admin/devices` URL will see masked push endpoints, share counts, what's-new stats, and ops health. No raw endpoints, no user identities, no personal data. Say the word later and I'll put the gate back.
