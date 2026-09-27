# Secure admin passcode reset

Forgot the admin passcode? Request a reset link by email, click it, set a new passcode yourself — no need to ask me.

## How it works

1. On the `/admin/devices` lock screen, a "Forgot passcode?" link opens a small form.
2. You enter the admin email address. If it matches the configured one, a reset email is sent. The screen always says "If that address is registered, a reset link is on its way" — so nobody can probe which address is right.
3. The email contains a one-time link valid for 30 minutes.
4. Opening it shows a "Set a new passcode" form (new passcode + confirm, minimum 10 characters).
5. Saving stores the new passcode hashed in the backend, invalidates the reset link, and clears any existing admin sessions so old cookies stop working. You then log in with the new passcode.

## Passcode storage

The passcode moves into the database, stored only as a salted hash (PBKDF2-SHA256) — never in plain text, never readable by me or anyone with database access. The current `ADMIN_PASSCODE` secret stays as the fallback used only until the first reset, so nothing breaks in the meantime.

## Prerequisites — now satisfied

- Email domain: `notify.elvishimself.com` is delegated and configured for sending.
- Admin email: `hello@elvishimself.com` is saved as `ADMIN_EMAIL`.

## Abuse protection

- Max 5 reset requests per hour, per visitor and per address.
- Max 10 passcode attempts per 15 minutes on the lock screen.
- Tokens are single use, expire in 30 minutes, and are stored hashed — a database leak can't be used to reset the passcode.
- The reset page is `noindex` and reveals nothing when the token is bad or expired.

## What was already built

- Migration: `admin_credentials` (single row: passcode hash, salt, version, updated_at) and `admin_reset_tokens` (token hash, expires_at, used_at, requested_ip_hash). No public policies on either — service-role access only, matching how `push_subscriptions` is handled.
- `src/lib/admin/passcode.server.ts` — PBKDF2 hashing and verification helpers.
- `src/lib/admin/gate.server.ts` — verify against the DB hash first, fall back to `ADMIN_PASSCODE` when no row exists; session invalidation via a `credentials_version` claim in the cookie.
- `src/lib/admin/reset.server.ts` — core reset logic for creating, verifying, and consuming tokens.
- `src/lib/admin/reset.functions.ts` — `requestAdminReset`, `verifyResetToken`, `completeAdminReset` server functions, throttled through the existing rate-limit helper.
- `src/routes/admin.reset.tsx` — route for the token link.
- `src/routes/admin.devices.tsx` — "Forgot passcode?" UI added to the lock screen.
- Email delivery is wired through Lovable's managed email infrastructure.

## Remaining work

1. Verify the email domain status is ready for sending and build/typecheck passes.
2. Wire the reset email template to send from `notify.elvishimself.com` to `hello@elvishimself.com`.
3. End-to-end test: request reset, receive token, set new passcode, verify the old session is invalidated, and new passcode works.
4. Surface any send/delivery issues in the UI if the domain is not yet verified.

## No changes to

Reader, sharing, push, maps, concordance, or any public route.
