# Fix admin portal login

Keep `/admin/devices` locked, but make the passcode actually work and tell you exactly why an unlock failed.

## What you'll do

1. Choose a new admin passcode — I'll store it securely as `ADMIN_PASSCODE` (server-only, never in the app bundle).
2. I'll regenerate `SESSION_SECRET` with a fresh 40+ character random value, so the unlocked-session cookie is guaranteed valid.
3. Enter the new passcode on `/admin/devices` and you're in for 7 days on that device.

## Why login may be failing (currently unconfirmed)

Secret values can't be read back, so the exact cause isn't confirmed. The three plausible causes are all covered by this plan:

- The stored passcode isn't what you're typing.
- `SESSION_SECRET` is shorter than the 32 characters the session cookie encryption requires — in that case the unlock succeeds but throws before the cookie is written, so the page stays locked.
- The 8-attempts-per-5-minutes throttle has been tripped by repeated tries, which currently looks identical in the UI to a wrong passcode on the first failure.

## Changes

- `src/lib/admin/gate.functions.ts`
  - Return a distinct reason from `unlockAdmin`: `wrong`, `throttled`, `misconfigured` (passcode secret missing), or `session_error` (cookie write failed), instead of a single generic `ok: false`.
  - Wrap the session write in try/catch so an encryption failure reports `session_error` rather than a blank 500.
  - Raise the throttle to 15 attempts per 5 minutes and key it per visitor as today.
- `src/routes/admin.devices.tsx`
  - Show the specific message for each reason on the unlock form ("Incorrect passcode", "Too many attempts — wait a few minutes", "Admin passcode is not configured", "Session could not be created").
- Secrets: set `ADMIN_PASSCODE` (your value) and regenerate `SESSION_SECRET`.
- Clear the existing `admin-unlock:*` rate-limit rows so you start from a clean attempt counter.

No changes to the reader, sharing, push, or any public route. The page stays `noindex`.
