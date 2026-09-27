# Bible Atlas — Whole-App UX Audit and Improvement Pass

Earlier passes already fixed map state, overlay dismissal, focus trapping, touch targets, and chapter navigation. This pass looks at the product as a whole: first impressions, how easy features are to find, how consistent the pieces are, and how the bottom of the screen behaves on phones.

## Step 1: Audit (delivered before any code changes)

- Walk through every major screen in the browser at 320, 390, 430, 820 and 1280px, in light and dark mode, at 100% and 200% text size, and in slow-network and offline states. Screens: home/reader, chapter picker, search, Explore menu, Maps + journey, People/Places lists and profiles, Timeline, Concordance, Connections, Highlights, Install, About, What's New.
- Put the findings in a table in chat: Issue, Why it matters, User impact, Recommendation, Priority (P0/P1/P2), Screen/component. Then list the top 10.
- Starting points confirmed in the code so far (to be checked in the browser before the audit relies on them):
  - **First visit:** "/" opens straight into Genesis 1 with nothing explaining what Bible Atlas is or what it offers beyond reading. Returning readers are silently redirected, with no "Continue reading" cue.
  - **Many one-off pop-ups:** reading settings, share, highlight, lexicon and measure tips are each hand-built dialogs. The chapter picker uses its own overlay, while other sheets use the shared dialog. Spinners are built separately in about 14 places, even though a shared status-message and skeleton already exist.
  - **Bottom of the screen:** the audio bar, chapter bar and prompts (install, update, offline, first-run) all compete for the same space on small phones.
  - **Study features:** Maps, People, Timeline and similar are reached through the header's Explore menu or through words highlighted in the text. The chapter itself doesn't point you to its places, people or journeys unless you open the Atlas panel.

## Step 2: Implement the top improvements (highest impact first)

The final list follows the audit. Expected areas:

1. **First-run welcome and Continue reading:** a light, dismissible intro on Genesis 1 for new visitors (what Bible Atlas is, plus 3 things to try). Returning readers get a short "Continue: John 4" notice instead of a silent jump.
2. **"In this chapter" context strip:** a compact, collapsible row under the chapter heading listing the chapter's places, people and journey, linking into the existing panel and map. Collapsed on phones and remembered per device.
3. **Shared sheet and popover:** move share, highlight, settings and the chapter picker onto the existing dialog and dismissible-layer foundations, with one look for handles, headers and close buttons.
4. **One loading and error language:** replace the one-off spinners and messages with the shared skeleton and status-message, and give every failure a clear next step (Retry, Open saved chapter, Go to reader).
5. **Bottom-stack rules:** one ordering rule for the audio bar, chapter bar and prompts, with only one prompt showing at a time above the chapter bar. Test with the keyboard open and in landscape.
6. **Search:** show search results grouped as Verses / People / Places, keep the query when you come back, and use clearer empty and loading states. Search itself works as it does today.
7. **Where-am-I cues:** consistent page titles and breadcrumbs on content pages. The Explore menu marks the current section, and People/Places filters are kept in the address.
8. **Content page consistency:** one heading, card and spacing pattern across People, Places, Timeline, Concordance and Connections.
9. **Reading typography polish:** check verse-number contrast and size, chapter-heading rhythm, and dark-mode contrast with the existing fonts and colours. No change to the visual identity.
10. **Accessibility sweep:** heading order, labels, visible focus, live regions for loading, and reduced motion.

## Step 3: Final first-time-user review

Walk through the app again with a fresh browser at phone, tablet and desktop sizes, answer the 12 quality questions in the brief, fix what comes up, then report: Fixed, UX Improvements, Remaining Issues, Next recommendations. Bump the version and add a release note.

## Guardrails

No changes to routes, data, translations, sign-in, outside services, offline features or saved preferences. No new libraries. No new map system. The existing colours, fonts and brand stay.

## Technical details

- Reuse `components/ui/dialog`, `state-message`, `skeleton`, and `hooks/use-dismissible-layer`. Add a thin `Sheet` wrapper over the Radix Dialog for bottom sheets.
- The context strip uses existing gazetteer/entity lookups already used for highlighting (no new API calls).
- The bottom stack is coordinated through the existing `PromptCoordinator` and the `--audio-bar-h`/`--chapter-nav-h` variables.
- Search state and list filters go in TanStack search params (zod-validated).
- Checks: `tsgo` typecheck, `vitest` (baseline 160), and Playwright at 320/390/430/landscape/820/1280, including 200% text and offline.
