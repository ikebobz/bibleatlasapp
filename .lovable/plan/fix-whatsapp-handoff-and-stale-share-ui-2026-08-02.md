# Fix WhatsApp handoff and stale Share UI

## Confirmed diagnosis

- A fresh check of both preview and `bibleatlas.lovable.app/genesis/1` returns HTTP 200 and shows **Share** and **Copy** after selecting Genesis 1:1. The current production bundle contains the feature; users who only see Copy are still running an older service-worker-cached app shell.
- The WhatsApp action is a normal `wa.me` share link. It is free and does not call the paid WhatsApp Business/Cloud API.
- In the Lovable preview, WhatsApp is being opened inside an embedded browsing context. WhatsApp redirects to `api.whatsapp.com`, which refuses iframe embedding, producing `ERR_BLOCKED_BY_RESPONSE`.

## Changes

1. **Make external share handoffs frame-safe**
   - Route WhatsApp and the other external share destinations through a small explicit external-navigation helper.
   - Open the destination as a real top-level/new-tab navigation from the user click rather than allowing the preview frame to render it.
   - If a popup/webview blocks that handoff, keep the Share sheet open and offer a copy-link fallback instead of showing a dead/error page.

2. **Recover stale published clients automatically**
   - Version the service-worker registration so older registrations are replaced.
   - On a newly activated worker, clear only legacy app-shell/page caches, preserve offline Scripture data and user settings/highlights, then reload once so the current UI appears.
   - Keep network-first navigation and automatic worker updates for future releases.

3. **Keep Share visible and resilient**
   - Preserve the current verse menu layout with Share beside Copy.
   - Ensure native-share permission failures always open the in-app channel sheet.
   - Ensure WhatsApp failure never closes the sheet before a successful handoff or copy fallback.

4. **Verify the real user paths**
   - Test a verse menu on preview and production.
   - Simulate a denied native share API and confirm the in-app sheet appears.
   - Confirm WhatsApp launches outside the preview frame.
   - Confirm a legacy service-worker/cache state upgrades to the current Share-enabled UI without deleting highlights or settings.

## Scope

No WhatsApp connector, bot, Business API account, paid messaging service, database change, or rate limiting is needed.