import { describe, expect, it } from "vitest";

import { BOOKS, getBook, getBookByNumber, matchBooks, parseReference, stepChapter } from "./bible";
import { DEFAULT_TRANSLATION, getTranslation, isTranslationId } from "./translations";
import { compareVersions, countItems, latestVersion, releasesSince } from "./release-notes";

describe("canon data", () => {
  it("contains all 66 books with unique ids", () => {
    expect(BOOKS).toHaveLength(66);
    expect(new Set(BOOKS.map((b) => b.id)).size).toBe(66);
  });

  it("looks books up by id and by canonical number", () => {
    expect(getBook("genesis")?.name).toBe("Genesis");
    expect(getBookByNumber(1)?.id).toBe("genesis");
    expect(getBook("nope")).toBeUndefined();
  });
});

describe("matchBooks", () => {
  it("finds books by full name, id and the short forms readers type", () => {
    expect(matchBooks("1 sam").map((b) => b.id)).toEqual(["1-samuel"]);
    expect(matchBooks("ps").map((b) => b.id)).toContain("psalms");
    expect(matchBooks("song of songs").map((b) => b.id)).toEqual(["song-of-solomon"]);
    expect(matchBooks("rev").map((b) => b.id)).toContain("revelation");
  });

  it("returns the whole canon when the box is empty, nothing when it is nonsense", () => {
    expect(matchBooks("")).toHaveLength(66);
    expect(matchBooks("   ")).toHaveLength(66);
    expect(matchBooks("zzzz")).toHaveLength(0);
  });
});

describe("stepChapter", () => {

  it("moves across book boundaries", () => {
    const back = stepChapter("exodus", 1, -1);
    expect(back?.book).toBe("genesis");
    expect(back?.chapter).toBe(50);
  });

  it("stops at the ends of the canon", () => {
    expect(stepChapter("genesis", 1, -1)).toBeNull();
    const last = BOOKS[BOOKS.length - 1];
    expect(stepChapter(last.id, last.chapters, 1)).toBeNull();
  });
});

describe("parseReference", () => {
  it("parses book, chapter and optional verse", () => {
    expect(parseReference("John 3:16")).toEqual({ book: "john", chapter: 3, verse: 16 });
    expect(parseReference("1 Kings 8")).toMatchObject({ book: "1-kings", chapter: 8 });
  });

  it("rejects nonsense", () => {
    expect(parseReference("Hobbits 1:1")).toBeNull();
  });
});

describe("translations", () => {
  it("defaults to KJV and falls back for unknown ids", () => {
    expect(DEFAULT_TRANSLATION).toBe("kjv");
    expect(getTranslation("nope").id).toBe(DEFAULT_TRANSLATION);
    expect(isTranslationId("web")).toBe(true);
    expect(isTranslationId("niv")).toBe(true);
    expect(isTranslationId("esv")).toBe(false);

  });
});

describe("release notes", () => {
  it("orders versions numerically, not lexically", () => {
    expect(compareVersions("1.10.0", "1.9.0")).toBeGreaterThan(0);
    expect(compareVersions("2.0.0", "2.0.0")).toBe(0);
  });

  it("returns nothing new for a reader on the latest version", () => {
    expect(releasesSince(latestVersion())).toHaveLength(0);
  });

  it("returns every release for a first-time reader", () => {
    const all = releasesSince(null);
    expect(all.length).toBeGreaterThan(0);
    expect(countItems(all)).toBeGreaterThan(0);
  });
});

import { bibleApiUrl } from "./chapter.server";
import { isChapterComplete } from "./chapter-complete";
import { describe as d2, it as i2, expect as e2 } from "vitest";
d2("one-chapter books", () => {
  i2("ask bible-api for the full verse range", () => {
    e2(bibleApiUrl("philemon", 1, "kjv", 25)).toBe("https://bible-api.com/philemon+1:1-25?translation=kjv");
    e2(bibleApiUrl("john", 3, "kjv")).toBe("https://bible-api.com/john+3?translation=kjv");
  });
  i2("reject partial chapters", () => {
    for (const b of ["philemon", "jude", "obadiah", "2-john", "3-john"]) e2(isChapterComplete(b, 1, 1)).toBe(false);
    e2(isChapterComplete("philemon", 1, 25)).toBe(true);
    e2(isChapterComplete("john", 3, [1, 3, 9, 16, 22, 31, 34].map((number) => ({ number })))).toBe(true);
    e2(isChapterComplete("philemon", 1, [{ number: 1 }])).toBe(false);
  });
});
