import { describe, expect, it } from "vitest";

import {
  chapterChunkCount,
  chapterEntries,
  entriesForSection,
  renderSitemapIndex,
  renderUrlset,
  sitemapSections,
  verseChunkCount,
  verseEntries,
} from "./sitemap";

describe("sitemap index", () => {
  it("lists pages, entities, books, chapter chunks and verse chunks", () => {
    const sections = sitemapSections();
    expect(sections[0]).toBe("pages");
    expect(sections).toContain("people");
    expect(sections).toContain("journeys");
    expect(sections).toContain("places");
    expect(sections).toContain("books");
    expect(sections).toContain(`verses-${verseChunkCount()}`);
    expect(sections.at(-1)).toBe("ru-verses");
    expect(sections.filter((s) => s.startsWith("chapters-"))).toHaveLength(chapterChunkCount());
    expect(sections.filter((s) => s.startsWith("verses-"))).toHaveLength(verseChunkCount());
  });

  it("only lists curated entity pages, on the canonical domain", () => {
    const people = entriesForSection("people") ?? [];
    const places = entriesForSection("places") ?? [];
    expect(people.map((e) => e.path)).toContain("/people/abraham");
    expect(places.map((e) => e.path)).toContain("/places/jerusalem");
    for (const e of [...people, ...places]) expect(e.path).toMatch(/^\/(people|places)\/[a-z0-9-]+(\/family-tree)?$/);
    expect(renderUrlset(people)).toContain("https://mybibleatlas.com/people/moses");
  });


  it("renders a valid sitemapindex on the canonical domain", () => {
    const xml = renderSitemapIndex(sitemapSections());
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("https://mybibleatlas.com/sitemaps/pages.xml");
    expect(xml).not.toMatch(/lovable\.(app|dev)/);
  });
});

describe("child sitemaps", () => {
  it("covers every chapter exactly once across the chunks", () => {
    const all = chapterEntries();
    const chunked = sitemapSections()
      .filter((s) => s.startsWith("chapters-"))
      .flatMap((s) => entriesForSection(s) ?? []);
    expect(chunked).toHaveLength(all.length);
    expect(new Set(chunked.map((e) => e.path)).size).toBe(all.length);
  });

  it("covers every verse in the canon exactly once", () => {
    const all = verseEntries();
    expect(all.length).toBeGreaterThan(31000);
    const chunked = sitemapSections()
      .filter((s) => s.startsWith("verses-"))
      .flatMap((s) => entriesForSection(s) ?? []);
    expect(chunked).toHaveLength(all.length);
    expect(new Set(chunked.map((e) => e.path)).size).toBe(all.length);
    expect(all.map((e) => e.path)).toContain("/john/3/16");
    for (const e of all) expect(e.path).toMatch(/^\/[a-z0-9-]+\/\d+\/\d+$/);
  });

  it("gives curated verses a higher priority", () => {
    const byPath = new Map(verseEntries().map((e) => [e.path, e.priority]));
    expect(byPath.get("/john/3/16")).toBe("0.7");
    expect(byPath.get("/john/3/15")).toBe("0.5");
  });


  it("rejects unknown sections", () => {
    expect(entriesForSection("nope")).toBeNull();
    expect(entriesForSection("chapters-999")).toBeNull();
  });

  it("renders absolute urlset locations", () => {
    const xml = renderUrlset(entriesForSection("books")!);
    expect(xml).toContain("<urlset");
    expect(xml).toContain("<loc>https://mybibleatlas.com/genesis</loc>");
  });
});

import { entriesForSection as sectionEntries } from "@/lib/sitemap";
describe("journey and family-tree sitemap entries", () => {
  it("lists every Paul leg and the family trees", () => {
    const j = sectionEntries("journeys")!.map((e) => e.path);
    expect(j).toContain("/journeys/paul");
    expect(j).toContain("/journeys/paul/first");
    expect(j).not.toContain("/journeys/jesus/main");
    expect(sectionEntries("people")!.map((e) => e.path)).toContain("/people/abraham/family-tree");
  });
});
