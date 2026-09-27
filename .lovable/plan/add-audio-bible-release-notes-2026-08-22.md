# Add Audio Bible release notes

## Goal
Surface the new Audio Bible feature to both returning and new users by adding a dedicated release version and refreshing the in-app announcement banner.

## Plan

1. Add a new release entry in `src/lib/release-notes.ts`
   - Version: `2.5.0`
   - Title: "Audio Bible"
   - Summary: Explain that the New Testament can now be listened to as a dramatic audio Bible.
   - Items:
     - How to start playback (player appears at the bottom of the screen when reading a chapter).
     - Where the audio comes from (WEB Drama NT via API.Bible / audio CDN).
     - Controls: play/pause, ±15s skip, scrubber, playback speed, mute, autoplay.
     - Auto-advance to the next chapter and book, stopping at Revelation 22.
   - Link: `Read John 3:16` → `/john/3/16`.

2. Add a new audio icon to the release icon type
   - Extend `ReleaseIcon` in `src/lib/release-notes.ts` to include `"headphones"` (or a suitable audio icon).
   - Import the corresponding Lucide icon in `src/routes/whats-new.tsx` and map it in `ICONS`.

3. Update the one-time announcement banner
   - In `src/components/reader/WhatsNewAnnouncement.tsx`, bump the localStorage key from `bible-atlas:announce-2.3.0` to `bible-atlas:announce-2.5.0`.
   - Rewrite the headline and body to call out the Audio Bible and how to use the bottom player.
   - Keep the CTA to `/whats-new` and the dismiss/tracking behavior unchanged.

4. Update the "How to find these features" section on `/whats-new`
   - Add a new bullet in the help box at the bottom of the page explaining that the audio player appears when reading New Testament chapters, with a note that it is currently available for the New Testament canon.

5. Verify
   - Run the build to ensure the new icon import and type additions compile.
   - Open `/whats-new` and the announcement banner in preview to confirm the audio Bible entry renders correctly and the tracking calls remain intact.

## Out of scope
No changes to the audio player logic, translation support, or offline behavior. Only the release notes, announcement banner, and help copy are touched.
