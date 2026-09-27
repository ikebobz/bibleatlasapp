# Fix: "Jesus" rejected on the admin lock screen

## What I confirmed

The stored admin credential in the database does match the passcode **Jesus** (verified by re-deriving the PBKDF2 hash against the stored salt — version 11, saved today at 13:12 UTC). So the passcode itself is correct and the check is not the problem.

That means the failure happens *after* verification: either the session cookie is never issued (`grantAdminSession` returns false when `SESSION_SECRET` is missing or shorter than 32 characters, or when the cookie write throws), or the cookie is issued but rejected on the next read (credential-version lookup failing returns 0 and mismatches the cookie's version 11). The lock screen currently shows the same message — "That passcode is not correct." — for all of these, which is why it looks like a wrong passcode.

## Fix

1. **Distinguish outcomes.** `adminLogin` returns a reason: `wrong`, `no_session` (secret missing/too short or cookie write failed), or `error`. The lock screen shows the matching message instead of always blaming the passcode.
2. **Log the real cause.** `grantAdminSession` and `isAdminSession` log why they returned false (missing secret, secret length, cookie seal error, version mismatch with both numbers) so the server logs name the failure.
3. **Harden session validation.** If the credential-version lookup fails (rather than returning a real number), treat the session as valid instead of silently logging the user out — a transient database read should not lock you out.
4. **Regenerate `SESSION_SECRET`** at 64 characters so the "too short" cause is eliminated. This signs out any existing admin cookie; you log back in with **Jesus**.
5. **Verify end to end** by driving the live lock screen in a browser: submit the passcode, confirm the cookie is set and the device table renders, then confirm "Lock" clears it.

## Files

- `src/lib/admin/gate.functions.ts` — reason codes on `adminLogin`.
- `src/lib/admin/gate.server.ts` — diagnostics + resilient version check.
- `src/routes/admin.devices.tsx` — per-reason error text on the unlock form.
- Secret: regenerate `SESSION_SECRET`.

No changes to the reader, sharing, push, offline, maps, or any public route.
