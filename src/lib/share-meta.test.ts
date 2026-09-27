import { describe, expect, it } from "vitest";

import {
  OG_DESCRIPTION_MAX,
  OG_TITLE_MAX,
  fitOnWordBoundary,
  normalizeVerseText,
  verseShareDescription,
  verseShareTitle,
} from "./share-meta";

describe("normalizeVerseText", () => {
  it("collapses whitespace and tidies punctuation spacing", () => {
    expect(normalizeVerseText("  In   the beginning ,  God  ")).toBe("In the beginning, God");
  });
});

describe("fitOnWordBoundary", () => {
  it("leaves short text untouched", () => {
    expect(fitOnWordBoundary("Jesus wept.", 40)).toBe("Jesus wept.");
  });

  it("never cuts mid-word and stays within the cap", () => {
    const text = "For God so loved the world that he gave his only begotten Son";
    const out = fitOnWordBoundary(text, 30);
    expect(out.length).toBeLessThanOrEqual(30);
    expect(out.endsWith("…")).toBe(true);
    expect(text.startsWith(out.slice(0, -1))).toBe(true);
  });
});

describe("verseShareTitle", () => {
  it("keeps the site suffix when it fits", () => {
    expect(verseShareTitle("John 3:16")).toBe(
      "John 3:16 — Bible Atlas — Read the Bible with Context & Maps",
    );
  });

  it("drops the suffix rather than clipping the reference", () => {
    const long = "Song of Solomon 8:14 (King James Version, red letter)";
    const out = verseShareTitle(long);
    expect(out).toBe(long);
    expect(out).not.toContain("Bible Atlas — Read the Bible with Context & Maps");
    expect(`${long} — Bible Atlas — Read the Bible with Context & Maps`.length).toBeGreaterThan(OG_TITLE_MAX);
  });
});

describe("verseShareDescription", () => {
  it("keeps the reference intact for very long verses", () => {
    const verse = "and ".repeat(200) + "amen";
    const out = verseShareDescription(verse, "Esther 8:9");
    expect(out.length).toBeLessThanOrEqual(OG_DESCRIPTION_MAX);
    expect(out).toContain("Esther 8:9");
  });

  it("quotes short verses in full", () => {
    expect(verseShareDescription("Jesus wept.", "John 11:35")).toBe(
      "“Jesus wept.” — John 11:35",
    );
  });
});
