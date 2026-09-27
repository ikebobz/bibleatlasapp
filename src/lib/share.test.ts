import { describe, expect, it } from "vitest";

import {
  entryUrl,
  shareTargets,
  shareUrlFor,
  threadUrl,
  verseCardUrl,
  verseUrl,
} from "./share";
import { parseDeepLink } from "./deep-link";
import { SITE_URL } from "./site";

const CANONICAL = "https://mybibleatlas.com";

const sample = {
  book: "john",
  chapter: 3,
  verse: 16,
  text: "For God so loved the world…",
  reference: "John 3:16",
};

describe("canonical origin", () => {
  it("resolves to the production domain", () => {
    expect(SITE_URL).toBe(CANONICAL);
  });
});

describe("generated links use the canonical domain", () => {
  it("verse deep links", () => {
    const url = verseUrl("john", 3, 16);
    expect(new URL(url).origin).toBe(CANONICAL);
    expect(new URL(url).pathname).toBe("/john/3/16");
    expect(new URL(url).searchParams.get("s")).toBe("share");
  });

  it("carries translation and atlas context, omitting the default version", () => {
    const plain = new URL(verseUrl("john", 3, 16, { translation: "kjv" }));
    expect(plain.searchParams.get("t")).toBeNull();

    const withCtx = new URL(verseUrl("john", 3, 16, { translation: "niv", entryId: "nicodemus" }));
    expect(withCtx.origin).toBe(CANONICAL);
    expect(withCtx.searchParams.get("t")).toBe("niv");
    expect(withCtx.searchParams.get("ref")).toBe("nicodemus");
  });

  it("entry links open the chapter with ?v= and the entry", () => {
    const url = new URL(entryUrl("bethlehem", { book: "genesis", chapter: 1, verse: 3 }));
    expect(url.origin).toBe(CANONICAL);
    expect(url.pathname).toBe("/genesis/1");
    expect(url.searchParams.get("v")).toBe("3");
    expect(url.searchParams.get("ref")).toBe("bethlehem");
  });

  it("thread links", () => {
    const url = new URL(threadUrl("passover"));
    expect(url.origin).toBe(CANONICAL);
    expect(url.pathname).toBe("/connections/passover");
    expect(url.searchParams.get("s")).toBe("share");
  });

  it("preview card URLs", () => {
    const url = new URL(verseCardUrl({ book: "john", chapter: 3, verse: 16, reference: "John 3:16" }));
    expect(url.origin).toBe(CANONICAL);
    expect(url.pathname).toBe("/api/public/og/verse");
  });

  it("every share channel embeds the canonical link and never a Lovable host", () => {
    const targets = shareTargets(sample);
    const canonical = shareUrlFor(sample);
    expect(canonical.startsWith(`${CANONICAL}/john/3/16`)).toBe(true);

    for (const [channel, value] of Object.entries(targets)) {
      expect(value, channel).not.toContain("lovable.app");
    }
    for (const channel of ["whatsapp", "telegram", "facebook", "x", "linkedin", "email", "sms"] as const) {
      expect(decodeURIComponent(targets[channel]), channel).toContain(canonical);
    }
  });
});

describe("shared links open the right route with highlighting", () => {
  it("a shared verse link resolves to that book, chapter and highlighted verse", () => {
    const parsed = parseDeepLink(shareUrlFor({ ...sample, translation: "kjv", entryId: "nicodemus" }));
    expect(parsed).toMatchObject({
      origin: CANONICAL,
      book: "john",
      chapter: 3,
      highlightVerse: 16,
      verseInPath: true,
      translation: "kjv",
      entryId: "nicodemus",
      fromShare: true,
    });
  });

  it("legacy ?v= chapter links still highlight the verse", () => {
    const parsed = parseDeepLink(entryUrl("eden", { book: "genesis", chapter: 2, verse: 8 }));
    expect(parsed?.highlightVerse).toBe(8);
    expect(parsed?.verseInPath).toBe(false);
  });

  it("rejects links to books or chapters that do not exist", () => {
    expect(parseDeepLink(`${CANONICAL}/nowhere/1/1`)).toBeNull();
    expect(parseDeepLink(`${CANONICAL}/john/99/1`)).toBeNull();
  });
});
