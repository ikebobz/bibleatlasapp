import { describe, expect, it } from "vitest";
import { classifySwipe } from "./chapter-swipe";
import { stepChapter } from "@/lib/bible";

describe("classifySwipe", () => {
  it("accepts clear horizontal swipes", () => {
    expect(classifySwipe(-120, 10, 200)).toBe("next");
    expect(classifySwipe(120, -10, 200)).toBe("prev");
  });
  it("ignores vertical scrolls and small or slow moves", () => {
    expect(classifySwipe(-80, 300, 200)).toBeNull();
    expect(classifySwipe(-30, 0, 100)).toBeNull();
    expect(classifySwipe(-200, 0, 2000)).toBeNull();
  });
});

describe("stepChapter boundaries", () => {
  it("handles canon edges and book changes", () => {
    expect(stepChapter("genesis", 1, -1)).toBeNull();
    expect(stepChapter("revelation", 22, 1)).toBeNull();
    expect(stepChapter("obadiah", 1, 1)).toEqual({ book: "jonah", chapter: 1 });
    expect(stepChapter("obadiah", 1, -1)).toEqual({ book: "amos", chapter: 9 });
    expect(stepChapter("malachi", 4, 1)).toEqual({ book: "matthew", chapter: 1 });
  });
});
