# Deep linking and universal sharing for every verse

Turn a shared link into the main way people discover Bible Atlas: any verse (and any atlas panel or thread) can be shared to any app, and the recipient lands on that exact verse — right translation, right highlight, right open panel — in the installed app when they have it, or in the browser with an install prompt when they don't.

## What the user gets

**Sharing**
- The verse menu Share action gains a full sheet: WhatsApp, Telegram, Facebook, X, LinkedIn, Discord (copy-for-paste), Email, SMS, and Copy link. Native OS share sheet still comes first where the device supports it.
- Share is also available from the open Atlas panel (share this place/person/artifact) and from a thread node, not just verses.
- Every share carries a link that encodes the verse, the translation being read, the highlighted verse, and the open panel.

**Receiving a link**
- Opening a shared link goes straight to the passage, scrolls to and flashes the verse, switches to the sender's translation, and re-opens the panel they had open.
- If Bible Atlas is installed as a PWA, the platform opens the installed app and focuses an existing window instead of spawning duplicates.
- If it isn't installed, the web reader opens instantly and a dismissible "Install Bible Atlas" prompt appears under the shared verse (native prompt on Android/desktop Chrome, Safari Add-to-Home-Screen instructions on iOS).

**Preview card**
- Links unfurl with the reference as title, the verse text as description, and a preview image that renders the actual verse text, the reference, the Bible Atlas mark and "Explore this verse in Bible Atlas" over the parchment background — instead of today's one static card.

## Technical notes

**Link format** — `https://bibleatlas.lovable.app/{book}/{chapter}?v={verse}&t={translation}&ref={entryId}&s=share`
- `src/lib/share.ts` builds it from current reader state; `s=share` (plus utm params) marks the visit as share-sourced.
- `src/routes/$book.$chapter.tsx` extends `validateSearch` with `t` and `s`; `ChapterReader`/`settings` apply an incoming `t` once on mount (session-only, does not overwrite the reader's saved default unless they keep reading in it), and `ref` already restores the panel.

**Dynamic preview image** — new server route `src/routes/api/public/og/verse.ts` renders the card with `satori` + `@resvg/resvg-wasm` (WASM-inlined, Worker-safe) into a 1200x630 PNG, cached with long `Cache-Control`. Text is fitted with the existing `src/lib/share-meta.ts` helpers so nothing truncates mid-word. If rendering fails the route redirects to the existing static `/og/verse-card.jpg`, so previews never break. The chapter route's `og:image`/`twitter:image` point at this endpoint with the verse encoded in the query.

**Metadata/SSR** — already server-rendered per route; extend the existing `head()` with `og:image:alt`, `og:locale`, `article:section`, LinkedIn/Discord-friendly absolute URLs, and keep canonical self-referencing the chapter (no query), which is already the case.

**PWA/deep links** — `public/manifest.webmanifest` gains `launch_handler: { client_mode: "focus-existing" }`, `capture_links`/`handle_links: "preferred"` so installed apps capture bibleatlas.lovable.app links, plus a `share_target` so users can share text *into* Bible Atlas to look up a reference. New `src/components/reader/InstallPrompt.tsx` listens for `beforeinstallprompt` and shows the iOS variant otherwise; it only appears on share-sourced visits.

**Analytics** — new insert-only table `public.share_events` (grants + RLS mirroring `whats_new_events`) recording: share initiated (target platform, resource type), share link opened (`s=share`), and conversion signals (install prompt shown/accepted, kept reading past the shared chapter). Surfaced as a "Sharing" section on the existing `/admin/devices` dashboard.

No changes to Scripture fetching, highlighting, or push. Everything else is client-side plus the one new image endpoint and one analytics table.
