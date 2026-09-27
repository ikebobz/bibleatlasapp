# Track "What's new" banner impressions and clicks

Record anonymous events whenever the release-notes banner is shown, clicked, or dismissed, plus visits to the What's new page, then read the totals from a small internal dashboard so you can confirm the update actually reached readers.

## Events captured

| Event | When it fires |
| --- | --- |
| `banner_impression` | The banner becomes visible to a reader (once per device per release) |
| `banner_click` | Reader taps "See what's new" in the banner |
| `banner_dismiss` | Reader taps the X |
| `nav_click` | Reader opens What's new from the sidebar/menu link |
| `page_view` | The /whats-new page is opened |

Each event also stores the release version, the reader's previously-seen version, and the unseen count — so you can see how many returning readers were reached per release. No accounts, no personal data: only a random per-device id kept in local storage.

## Dashboard

The existing internal `/admin/devices` page gains a "What's new" section (behind the same passcode) showing, per release version: impressions, clicks, dismissals, page views, and a click-through rate.

## Technical notes

- Migration: `public.whats_new_events` (`event`, `release_version`, `last_seen_version`, `unseen_count`, `device_id`, `created_at`). `GRANT INSERT` to `anon` and `authenticated`, `GRANT ALL` to `service_role`; RLS on with an insert-only policy for anon/authenticated and no public read (reads happen server-side via the admin client).
- New `src/lib/analytics/whats-new-events.ts`: client helper `trackWhatsNew(event, payload)` that lazily gets/creates `bible-atlas:device-id` in localStorage and inserts through the generated Supabase browser client; fire-and-forget with errors swallowed so analytics never breaks the reader.
- Impression dedupe: a `bible-atlas:wn-impressions` localStorage entry holding the release version already counted, so a page-per-page reader isn't counted repeatedly.
- `src/components/reader/ReaderChrome.tsx`: `WhatsNewBanner` fires the impression in a `useEffect` once `ready && unseenCount > 0`, and wires click/dismiss handlers; `WhatsNewNavLink` fires `nav_click`.
- `src/routes/whats-new.tsx`: fires `page_view` alongside the existing `markSeen()` effect.
- New `src/lib/admin/whats-new-stats.functions.ts`: a server function guarded by the existing admin gate that aggregates counts per release version with the admin client; rendered in `src/routes/admin.devices.tsx`.
