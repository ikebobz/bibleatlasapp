# Daily Verse diagnostics modal

Replace the cramped "Device details" strip inside the settings menu with a full diagnostics dialog that runs live checks and tells the reader exactly what to do next.

## Entry point

In the Daily Verse panel, the collapsible "Device details" section becomes a single "Run diagnostics" button (also surfaced automatically next to "Try again" whenever the status is Blocked, Not supported, or Error). Opening it runs the checks fresh rather than reusing whatever the toggle last saw.

## What the modal shows

A checklist, each row with a pass / warn / fail icon, a plain-language result, and — when it is not a pass — one concrete next action:

| Check | Fail message and action |
| --- | --- |
| Browser support (serviceWorker, PushManager, Notification) | "This browser can't receive web push." Suggest Chrome/Edge/Firefox on desktop and Android, Safari 16.4+ on iOS. |
| Installed to Home Screen (iOS only) | "Safari only allows notifications for installed apps." Tap Share → Add to Home Screen → open from there. |
| Site context (published site vs editor preview / iframe / dev) | "Notifications only run on the published site." Link to open bibleatlas.lovable.app in a new tab. |
| Notification permission (granted / default / denied) | Denied → per-browser unblock steps already written for the toggle. Default → "Allow the prompt when you tap Daily verse." |
| Service worker registration and state (registered, installing/waiting/active, scope) | Not active → "Reload the page" button that reloads with the worker update forced. |
| Push subscription present, and whether its key matches the current server key | Stale key → explain the device will re-register on the next activation. |
| Backend record — a lightweight round trip so the reader knows the server actually has this device | Unreachable → show the returned code and "try again in a moment". |

Below the checklist: a one-line verdict ("Everything looks ready" / "Notifications are blocked in browser settings" / etc.), a primary action button matching the verdict (Turn on Daily verse, Reload, Open published site, Copy report), and the raw report block (permission, worker state and scope, endpoint host, VAPID key match, timezone, chosen time, user agent, app URL) with Copy.

The modal is re-runnable in place via a "Re-run checks" button, so a reader can change a browser setting and confirm the fix without leaving the page.

## Technical notes

- New `src/lib/push/diagnostics.ts` exporting `runPushDiagnostics(): Promise<DiagnosticsReport>` — an array of `{ id, label, state: "pass" | "warn" | "fail", detail, action? }` plus a derived overall verdict. It reuses `pushAvailability()`, `permissionState()`, `serviceWorkerAllowed()`, `navigator.serviceWorker.getRegistration("/")` and `currentSubscription()` rather than duplicating logic, and exposes the existing VAPID key comparison as a named export from `src/lib/push/subscribe.ts`.
- Backend check: add a `GET` handler to `src/routes/api/public/push/subscribe.ts` accepting an `endpoint` query param and returning `{ registered: boolean }` only — no subscription data echoed back. Skipped when there is no local subscription.
- New `src/components/reader/PushDiagnostics.tsx` using the existing `@/components/ui/dialog` shadcn component; `PushToggle.tsx` renders it and drops its inline details block, keeping every other behaviour (activation flow, time picker, test push) unchanged.
- The diagnostics run never requests notification permission — it only reads current state, so opening it can't burn the one-shot prompt.
- No schema changes.
