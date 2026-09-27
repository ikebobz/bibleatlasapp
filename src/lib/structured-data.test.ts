import { describe, expect, it } from "vitest";

import { bookStructuredData, homeStructuredData, readerStructuredData } from "./structured-data";

describe("structured data", () => {
  it("describes a book with its chapters", () => {
    const graph = bookStructuredData({
      bookId: "genesis",
      bookName: "Genesis",
      chapters: 50,
      description: "Read every chapter of Genesis.",
    })["@graph"] as Record<string, unknown>[];
    const book = graph[0] as { "@type": string; numberOfPages: number; hasPart: unknown[] };
    expect(book["@type"]).toBe("Book");
    expect(book.numberOfPages).toBe(50);
    expect(book.hasPart).toHaveLength(50);
    expect(graph[1]["@type"]).toBe("BreadcrumbList");
  });

  it("links a chapter to its book", () => {
    const graph = readerStructuredData({
      bookId: "john",
      bookName: "John",
      chapters: 21,
      chapter: 4,
      description: "John 4",
    })["@graph"] as Record<string, unknown>[];
    const chapter = graph[1] as { "@type": string; isPartOf: { "@id": string } };
    expect(chapter["@type"]).toBe("Chapter");
    expect(chapter.isPartOf["@id"]).toBe("https://mybibleatlas.com/john#book");
    expect(graph).toHaveLength(3);
  });

  it("adds the verse entity and a four-step breadcrumb", () => {
    const graph = readerStructuredData({
      bookId: "john",
      bookName: "John",
      chapters: 21,
      chapter: 4,
      verse: 4,
      verseText: "And he must needs go through Samaria.",
      description: "John 4:4",
    })["@graph"] as Record<string, unknown>[];
    const verse = graph[2] as { "@id": string; text: string };
    expect(verse["@id"]).toBe("https://mybibleatlas.com/john/4/4#verse");
    expect(verse.text).toContain("Samaria");
    const crumbs = graph[3] as { itemListElement: unknown[] };
    expect(crumbs.itemListElement).toHaveLength(4);
  });
});

describe("home structured data", () => {
  it("declares a WebPage, a search action and a breadcrumb root", () => {
    const graph = homeStructuredData({
      title: "Bible Atlas",
      description: "Read the Bible with context.",
      image: "https://mybibleatlas.com/og/default-card.jpg",
    })["@graph"] as Record<string, any>[];
    expect(graph[0]["@type"]).toBe("WebPage");
    expect(graph[0].url).toBe("https://mybibleatlas.com/");
    expect(graph[1].potentialAction["@type"]).toBe("SearchAction");
    expect(graph[1].potentialAction.target.urlTemplate).toContain("https://mybibleatlas.com/");
    expect(graph[2]["@type"]).toBe("BreadcrumbList");
  });
});

describe("verse entity enrichment", () => {
  it("carries publisher, citation and free-access flags", () => {
    const graph = readerStructuredData({
      bookId: "john",
      bookName: "John",
      chapters: 21,
      chapter: 3,
      verse: 16,
      verseText: "For God so loved the world",
      description: "John 3",
    })["@graph"] as Record<string, any>[];
    const verse = graph[2];
    expect(verse.citation).toBe("John 3:16");
    expect(verse.isAccessibleForFree).toBe(true);
    expect(verse.publisher["@id"]).toBe("https://mybibleatlas.com/#organization");
    expect(graph[1].publisher["@id"]).toBe("https://mybibleatlas.com/#organization");
  });
});
