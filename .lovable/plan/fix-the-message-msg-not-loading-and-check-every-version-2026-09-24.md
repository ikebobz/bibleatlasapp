# Fix The Message (MSG) not loading, and check every version

## What's wrong (confirmed)
The Message isn't broken on phones only — it fails everywhere. The text service returns it fine, but The Message groups verses into paragraphs (e.g. "1-2", "3-5"), so John 3 arrives as 13 blocks instead of 36 verses. The safety check added for the Philemon fix counts blocks, decides the chapter is "only partly downloaded", and throws it away. Tested: MSG John 3, Genesis 1, Psalm 23 and Philemon all rejected; NIV, Yoruba and Igbo pass.

## Fix
1. When reading licensed text, remember where each paragraph ends (a "1-3" block covers verses 1 to 3).
2. Change the completeness check to ask "does the text reach the last verse of the chapter?" instead of "are there enough separate blocks?". A genuinely cut-off reply (like the old Philemon verse-1-only bug) still fails.
3. Apply the same check to saved copies and on-device downloads so MSG chapters aren't treated as missing.
4. Add tests: MSG-style grouped chapter passes; single-verse Philemon reply still fails.

## Check every version
Run the app's own loader for all versions (KJV, WEB, ASV, BSB, NIV, MSG, YLT, Darby, BBE, DRA, Luther, Segond, Almeida, RV1909, Statenvertaling, Synodal, CUV, Yoruba, Igbo, Vulgate) on Genesis 1, Psalm 23, John 3 and Philemon, fix any other failures found, then open MSG John 3 in the preview on a phone-sized screen.

## Technical details
- `src/lib/apibible.server.ts`: parse verse-range labels, add optional `through` to each verse.
- `src/lib/chapter-complete.ts`: accept verses, use max(`through` ?? `number`) vs expected count (keep 90% tolerance).
- Callers: `chapter.server.ts`, `offline/chapter-store.ts`, `chapter-fallback.server.ts`.
