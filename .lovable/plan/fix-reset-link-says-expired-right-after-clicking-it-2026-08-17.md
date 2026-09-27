# Fix: reset link says "expired" right after clicking it

## What the data shows

Your two most recent reset attempts (13:03 and 13:04 today) both marked the reset link as *used* in the database — but the stored passcode was never updated (it still shows the previous change at 12:57). So the link was not expired at all: the passcode save step failed, and the code reports every failure with the same message, "This reset link is no longer valid."

Worse, the link is burned before the save is attempted, so retrying the same link can never work — which is exactly what you experienced.

The reason the save itself failed is not yet confirmed (the failure is currently logged without any detail). The fix below both removes the trap and surfaces the real cause.

## The fix

1. **Save first, burn the link second.** Reserve the link, write the new passcode, and only mark the link used once the write succeeded. If anything fails, the link stays valid and can be clicked again.
2. **Confirm the write.** After saving, re-read the stored credential and verify the new passcode actually verifies before declaring success.
3. **Honest error messages.** Separate "this link really is invalid/expired" from "something went wrong saving — your link still works, try again". No more one-size-fits-all "expired".
4. **Real diagnostics.** Log the actual database/exception detail on the save path (server-side only, never the passcode) so the underlying cause is visible instead of silent.
5. **Client hardening.** Keep the submit button locked while in flight, and stop turning a thrown server error into the misleading "link no longer valid" text.

## Verification

- End-to-end run: request a reset email, click the link, set a new passcode, confirm the stored credential row updates and the link is marked used only then.
- Confirm signing in with the new passcode works and older admin sessions are invalidated.
- Confirm a deliberately failed save leaves the link reusable.
- If step 4 reveals a concrete backend cause, fix that too in the same pass.

## Technical notes

- `src/lib/admin/passcode.server.ts`: split `consumeResetToken` into a validate step and a `markResetTokenUsed` step; log `error.message`/`details` from the credential upsert; add a post-write verification read.
- `src/lib/admin/reset.functions.ts`: reorder to validate token -> `setPasscode` -> mark used -> start session; add a `failed` reason distinct from `invalid`; wrap the handler so exceptions return `failed` instead of escaping.
- `src/routes/admin.reset.tsx`: render the new `failed` reason with a retry-friendly message; catch path no longer maps to `invalid`.

## Not touched

Reader, sharing, push, maps, concordance, email templates, or any public route.
