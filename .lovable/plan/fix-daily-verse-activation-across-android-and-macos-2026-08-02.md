# Fix Daily Verse activation across Android and macOS

## Confirmed state

- The published app serves an active `/sw.js`, and that worker imports the notification handler from `/push-sw.js`.
- The browser-facing VAPID public key has the required P-256 format.
- The backend currently contains zero push subscriptions, so the shared failure occurs during browser registration/subscription or while saving that subscription—not while selecting the daily verse or running scheduled delivery.

## Implementation

1. **Replace the fragile activation sequence**
   - Make one notification activation function own the complete flow: permission, worker readiness, existing-subscription lookup, subscription creation, and backend save.
   - Reuse an existing valid browser subscription instead of blindly calling `subscribe()` again.
   - Explicitly update and activate the published worker before subscribing, with bounded waits and a clean retry path for first-load Android behavior.
   - Preserve the user gesture for permission and subscription calls while avoiding the current nested promise/retry sequence.

2. **Make failures recoverable and visible**
   - Return structured activation stages and browser error codes instead of collapsing failures into a generic message.
   - Detect blocked permission, unsupported browser, stale/mismatched subscriptions, worker startup failure, timeout, and backend rejection separately.
   - If a stale subscription is detected, unsubscribe it once and create a fresh subscription with the current public key.
   - Keep the toggle state synchronized with the browser’s actual subscription after every attempt and reload.

3. **Harden subscription persistence**
   - Validate the complete subscription payload before sending it.
   - Read and surface the backend response body when saving fails.
   - Make backend upsert errors diagnosable without exposing subscription credentials, while preserving the existing public endpoint’s strict validation.

4. **Verify the full path**
   - Test worker registration and UI state in a production-mode local build because workers are intentionally disabled in the editor preview.
   - Verify blocked, first-time permission, already-subscribed, stale-subscription, enable, disable, reload, and test-notification paths.
   - Confirm a successful activation creates a backend device row and that a test push reaches the generated worker handler.

## Technical scope

- Update the registration wrapper, browser push subscription module, Daily verse toggle, and subscription endpoint only.
- Keep the existing offline worker, generated Workbox setup, notification schedule, selected delivery time, and daily-verse content sources unchanged.