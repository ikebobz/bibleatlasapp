# Chapter picker opens on the book list

Today, tapping "John 4" in the bottom bar opens straight into John's chapter grid. Following Bible.com, it will open on the full list of books instead.

## What changes

- Tapping the centre "John 4" opens the sheet on the **book list** for the current testament, with the Old | New Testament toggle at the top.
- The current book (John) is highlighted and scrolled into view, so you can see where you are and pick any other book.
- Tapping a book **expands its chapter numbers right underneath it** in the list, like Bible.com. Tapping another book collapses the first one and expands the new one. Tapping the open book again closes it.
- Tapping a chapter goes to it and closes the sheet, as it does now.
- One-chapter books (Obadiah, Jude and others) still go straight to that chapter.
- The current chapter stays filled in and offline markers stay. Closing the sheet still leaves your place untouched.

## Left unchanged

The bottom bar, arrows, swipe, header, sidebar, audio player and everything else in the reader.

## Technical details

- `ChapterSheet.tsx`: when opening, set `picked` to `null` rather than `book`. Remove the separate chapter-grid view and its back button. Render the chapter grid inline below the expanded book row (accordion, `aria-expanded`). After opening, scroll the current book row into view (`scrollIntoView({ block: "center" })`).
- Grid columns stay at 5–8, and long books (Psalms) scroll with the list.
- Patch version bump with a short release note. Playwright check at 390px: the sheet opens on the list, John is visible, expanding Psalms and choosing 119 works.
