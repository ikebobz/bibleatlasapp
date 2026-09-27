# Internal admin page for push devices

A private `/admin/devices` page, unlocked with a shared passcode, showing every registered notification device so you can troubleshoot delivery.

## Access

- One shared passcode you set (stored as a server-only secret, never in the app bundle).
- Visiting `/admin/devices` while locked shows a passcode form; correct entry sets an encrypted cookie that keeps you unlocked for 7 days on that device.
- A "Lock" button clears it. No accounts, no sign-up.
- The page is marked noindex so it never appears in search.

## What the page shows

Table of registered devices, newest first:

- Masked endpoint (provider host + last 8 characters, e.g. `fcm.googleapis.com/…a1b2c3d4`) so a full push endpoint is never exposed
- Registered (created) date/time
- Last sent date/time
- Failure count

Plus a header line with the total device count and a refresh button. Empty state reads "No devices registered yet" — which is the current state of the database (0 rows), so that's what you'll see until a device subscribes.

## Technical notes

- New secrets: `ADMIN_PASSCODE` (you provide the value) and `SESSION_SECRET` (generated).
- `src/lib/admin/gate.functions.ts` — `unlockAdmin` (timing-safe compare), `lockAdmin`, and `listPushDevices`, which checks the session first and then reads `push_subscriptions` via the admin client. Endpoint masking happens server-side, so the raw endpoint never reaches the browser.
- `src/routes/admin.devices.tsx` — loader calls `listPushDevices`; renders the unlock form when locked, the table when unlocked. Styled with existing parchment tokens and shadcn table/card components.
- No database migration needed; reads the existing `push_subscriptions` table.
- No changes to the reader, push subscription flow, or existing routes.
