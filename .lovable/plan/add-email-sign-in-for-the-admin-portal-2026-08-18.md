# Add email sign-in for the admin portal

## What I confirmed

- `/admin/devices` currently supports passcode login and emailed passcode-reset links.
- The email sender domain `notify.elvishimself.com` is verified and ready.
- The configured admin email is checked only on the server, and the browser receives the same response whether an address matches or not.
- Both passcode login and reset completion ultimately depend on the same signed `atlas_admin` session cookie. Therefore, an email link bypasses the passcode/hash problem, but the implementation must also verify that the session was actually created before consuming the one-time login token.

## Implementation

1. **Add “Email me a sign-in link” to the lock screen.**
   - Keep passcode login available as a fallback.
   - Accept an email address and always show a neutral response to prevent revealing the configured admin address.
   - Reuse the existing per-visitor rate limiting pattern and add a global send ceiling.

2. **Create dedicated one-time login tokens.**
   - Store only a SHA-256 token hash, never the raw token.
   - Tokens expire after 15 minutes and can be used once.
   - Add explicit database grants, enable RLS, and expose no public policies; access remains server-only.

3. **Send a branded secure sign-in email.**
   - Send only to the configured admin email through the verified Bible Atlas sender domain.
   - Link to a noindex admin sign-in confirmation page.
   - Keep the response identical for matched and unmatched addresses.

4. **Use a confirmation step instead of signing in on link open.**
   - The emailed link opens a page with a “Continue to admin” action.
   - This prevents mail security scanners and link-preview bots from consuming the token.
   - On confirmation, validate the token, create the signed admin session, verify the session write succeeded, then mark the token used and navigate to `/admin/devices`.
   - If session creation fails, keep the token valid and show a specific retry message.

5. **Harden and verify the shared session path.**
   - Preserve the existing 8-hour httpOnly, same-site admin cookie.
   - Add focused diagnostics for token validation, cookie issuance, and the first authenticated dashboard request without logging secrets or raw tokens.
   - Verify in preview and on the published site: request email → open link → confirm → dashboard appears without manual refresh → reload remains signed in → reused link is rejected.

## Technical scope

- New migration for a locked-down `admin_login_tokens` table.
- New thin server-function wrappers plus server-only token/email helpers.
- New `/admin/sign-in` confirmation route.
- Update only the locked state of `/admin/devices`; the dashboard panels and public reader remain unchanged.

## Expected result

The admin portal can be opened from a short-lived email link without entering `Jesus`. This bypasses passcode verification while retaining the same protected admin session and adds enough verification to identify any remaining cookie problem precisely.
