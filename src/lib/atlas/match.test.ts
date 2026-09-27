import { describe, expect, it } from "vitest";
import { annotateVerse } from "./match";

const context = { book: "john", chapter: 4, verse: 4 };

function cueFor(text: string, word: string) {
  return annotateVerse(text, context).find((part) => part.value === word && (part.type === "entry" || part.type === "auto"));
}

describe("reader context cues", () => {
  it("links Genesis 1:12 to fruit-bearing trees rather than a Roman cross", () => {
    const verse = "And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.";
    const tree = annotateVerse(verse, { book: "genesis", chapter: 1, verse: 12 })
      .find((part) => part.value === "the tree");
    expect(tree).toMatchObject({ type: "entry", entryId: "fruit-bearing-trees" });
    expect(tree).not.toHaveProperty("cue.model3d", true);
  });

  it("keeps explicit crucifixion language linked to the Roman cross", () => {
    expect(cueFor("They crucified him there.", "crucified"))
      .toMatchObject({ type: "entry", entryId: "roman-cross", cue: { model3d: true } });
  });

  it("marks actual mapped places in curated entries and the wider gazetteer", () => {
    expect(cueFor("He went through Samaria.", "Samaria")).toMatchObject({ type: "entry", cue: { map: true } });
    expect(cueFor("He went to Bethlehem.", "Bethlehem")).toMatchObject({ type: "auto", cue: { map: true } });
    expect(cueFor("He reached Sychar.", "Sychar")).toMatchObject({ type: "entry", cue: { map: true } });
  });

  it("does not mark unmapped words just because their kind is place or object", () => {
    expect(cueFor("He went to Byblos.", "Byblos")).toMatchObject({ type: "auto" });
    expect(cueFor("He went to Byblos.", "Byblos")).not.toHaveProperty("cue.map", true);
    const tree = cueFor("He saw the tree of life.", "the tree of life");
    expect(tree).toMatchObject({ type: "entry" });
    expect(tree).not.toHaveProperty("cue.model3d", true);
  });

  it("reserves the 3D cue for entries with a model block", () => {
    expect(cueFor("He carried the ark of the covenant.", "ark of the covenant"))
      .toMatchObject({ type: "entry", cue: { model3d: true } });
  });

  it("does not suggest an unmapped place is certain archaeological evidence", () => {
    expect(cueFor("He went to Byblos.", "Byblos")).not.toHaveProperty("cue.archaeology", true);
  });
});