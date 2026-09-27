# Correct the tree context in Genesis 1

## Goal
Tapping “the tree” in Genesis 1:12 should open context about the fruit-bearing trees in the creation account, not a Roman cross.

## Changes
1. Remove the generic “the tree” phrase from the Roman-cross entry. Keep its unambiguous cross/crucifixion phrases; a general mention of a tree must not imply an execution device in other chapters either.
2. Add a short, Scripture-grounded Atlas entry for the fruit-bearing trees of Genesis 1, limited to that chapter. Describe trees bearing fruit with seed according to their kinds, without assigning a species, archaeological claim, or 3D model that the passage does not establish.
3. Regenerate the reader’s lightweight Atlas index so the displayed link and the panel resolve to the same entry, and the false 3D cue disappears.
4. Add regression checks for Genesis 1:12, the cross in crucifixion passages, and named Eden trees. Check the tap-to-panel result on phone and desktop.

## Technical notes
The reader matcher uses phrases from the generated Atlas index. The Roman-cross artifact currently includes an unrestricted “the tree” match; Genesis 1:12’s wording triggers it, so the reader labels the word as a 3D model and opens that artifact. Keep the correction in the existing Atlas entry and matching flow; do not add a second viewer or alter navigation.
