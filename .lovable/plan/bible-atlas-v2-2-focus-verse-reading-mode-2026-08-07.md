# Bible Atlas v2.2 — Focus Verse Reading Mode

Make a selected verse the unmistakable visual anchor of the chapter, without changing any existing reader behaviour.

## Experience

- Arriving at a verse (sidebar verse row, search, deep link `/john/4/4`, shared link `?v=4`, cross-reference, or any future entry point) scrolls the verse into the upper-middle of the viewport, clear of the sticky header and any open context panel.
- The verse gets a calm focus treatment: a soft primary-tinted background, a left accent rule, and a faint ring — readable in light and dark mode, distinct from the user's own colour highlights.
- Surrounding verses fade slightly (never below comfortable reading contrast) for about a second and a half after arrival, then return to normal. The focused verse keeps its highlight for the whole visit.
- The highlight fades in once, on arrival. Manual scrolling never re-triggers it or re-dims the text. Selecting a different verse moves the focus; only one verse is ever focused.
- With `prefers-reduced-motion`, the scroll jumps instantly and the highlight appears with no animation or dimming.

## Accessibility

- Focus is signalled by background + accent border + ring, not colour alone.
- The focused verse carries `aria-current="location"` and a screen-reader label naming the reference as the current verse; the verse span is made focusable so keyboard users can tab to it, and it receives programmatic focus on arrival without stealing focus during normal reading.
- Focus styling survives opening a context panel and works in portrait and landscape.

## Technical notes

- Single source of truth stays the existing `highlightVerse` prop threaded from both routes into `ChapterReader`. No new selection state.
- New `src/components/reader/useVerseFocus.ts`: given `book`, `chapter`, `highlightVerse` and loaded data, it scrolls (respecting reduced motion), toggles a short-lived `verse-dim-context` class on the verse container, and returns the focused verse number. Replaces the ad-hoc scroll/`verse-active` effect currently inside `ChapterBody`.
- `Verse.tsx` gains a `focused` prop that applies `verse-focus`, the ARIA attributes and `tabIndex={-1}`; it keeps rendering all existing interactive segments (people, places, measures, lexicon, highlight menu, share) untouched.
- `src/styles.css`: add `.verse-focus` (light + dark), a `scroll-margin-top` accounting for the 3.5rem sticky header, a `.verse-dim-context` rule dimming non-focused verse spans, and a reduced-motion guard. Existing `.verse-active` and `.verse-highlight` rules stay for user highlights.
- Routes, loaders, head metadata, share links and offline behaviour are unchanged.
