import { describe, expect, it } from "vitest";

import { buildReaderHead } from "./reader-head";
import { verseUrl } from "./share";

function metaOf(head: ReturnType<typeof buildReaderHead>, key: string) {
  return head.meta.find(
    (m) => (m as { name?: string }).name === key || (m as { property?: string }).property === key,
  ) as { content: string } | undefined;
}

describe("reader head", () => {
  it("canonicalises a path verse to /book/chapter/verse", () => {
    const head = buildReaderHead({
      bookId: "john",
      bookName: "John",
      chapter: 4,
      verse: 4,
      verseText: "And he must needs go through Samaria.",
      verseInPath: true,
    });
    expect(head.links[0].href).toBe("https://mybibleatlas.com/john/4/4");
    expect(metaOf(head, "og:url")?.content).toBe("https://mybibleatlas.com/john/4/4");
    expect(metaOf(head, "og:title")?.content).toContain("John 4:4");
  });

  it("keeps the chapter canonical for legacy ?v= links", () => {
    const head = buildReaderHead({
      bookId: "john",
      bookName: "John",
      chapter: 4,
      verse: 4,
      verseText: "text",
    });
    expect(head.links[0].href).toBe("https://mybibleatlas.com/john/4");
    expect(metaOf(head, "og:url")?.content).toBe("https://mybibleatlas.com/john/4?v=4");
  });

  it("falls back to the chapter when no verse is featured", () => {
    const head = buildReaderHead({ bookId: "genesis", bookName: "Genesis", chapter: 1 });
    expect(head.links[0].href).toBe("https://mybibleatlas.com/genesis/1");
  });
});

describe("verse share links", () => {
  it("uses the permanent verse path", () => {
    const url = new URL(verseUrl("romans", 8, 28, { origin: "https://mybibleatlas.com" }));
    expect(url.pathname).toBe("/romans/8/28");
    expect(url.searchParams.get("s")).toBe("share");
  });

  it("carries a non-default translation", () => {
    const url = new URL(
      verseUrl("john", 4, 4, { translation: "web", origin: "https://mybibleatlas.com" }),
    );
    expect(url.pathname).toBe("/john/4/4");
    expect(url.searchParams.get("t")).toBe("web");
  });
});
