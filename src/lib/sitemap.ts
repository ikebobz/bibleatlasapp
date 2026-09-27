import { familyTreeSlugs } from "@/lib/entities/family-trees";
/**
 * Shared sitemap building blocks.
 *
 * `/sitemap.xml` serves a sitemap index; each child document is served by
 * `/sitemaps/$section.xml`. Keeping the entry builders here means the index and
 * the children can never disagree about which sections exist.
 */

import { BOOKS } from "@/lib/bible";
import { JOURNEYS } from "@/lib/atlas/journeys";
import { THREAD_NODES } from "@/lib/threads/data";
import { POPULAR_TERMS, termSlug } from "@/lib/concordance/terms";
import { PUBLISHED_PEOPLE, PUBLISHED_PLACES } from "@/lib/entities/registry";
import { SITE_URL as BASE_URL } from "@/lib/site";
import { versesInChapter } from "@/lib/verse-counts.generated";
import { LANG_CODES, htmlLang, isLangCode, type LangCode } from "@/lib/lang-routes";

export { BASE_URL };

export interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  /** English reader path whose language siblings get hreflang alternates. */
  alt?: string;
}

/** Well under the 50,000-URL / 50 MB limit, so chunks stay small and cacheable. */
export const CHAPTER_CHUNK_SIZE = 500;

/** Verse sitemaps are far larger (~31,000 URLs), so they use bigger chunks. */
export const VERSE_CHUNK_SIZE = 2000;


/**
 * Curated verses that people search for by reference. The remaining ~31,000
 * verse URLs stay crawlable through their chapter pages instead of diluting
 * crawl budget with thin duplicates. Add references here to widen coverage.
 */
export const POPULAR_VERSES: Array<[book: string, chapter: number, verse: number]> = [
  ["genesis", 1, 1],
  ["exodus", 20, 3],
  ["joshua", 1, 9],
  ["psalms", 23, 1],
  ["psalms", 46, 10],
  ["psalms", 119, 105],
  ["proverbs", 3, 5],
  ["isaiah", 40, 31],
  ["isaiah", 41, 10],
  ["jeremiah", 29, 11],
  ["micah", 6, 8],
  ["matthew", 6, 33],
  ["matthew", 11, 28],
  ["matthew", 28, 19],
  ["mark", 12, 30],
  ["luke", 1, 37],
  ["john", 1, 1],
  ["john", 3, 16],
  ["john", 14, 6],
  ["acts", 1, 8],
  ["romans", 3, 23],
  ["romans", 5, 8],
  ["romans", 6, 23],
  ["romans", 8, 28],
  ["romans", 12, 2],
  ["1corinthians", 13, 4],
  ["2corinthians", 5, 17],
  ["galatians", 2, 20],
  ["galatians", 5, 22],
  ["ephesians", 2, 8],
  ["philippians", 4, 6],
  ["philippians", 4, 13],
  ["colossians", 3, 23],
  ["1thessalonians", 5, 16],
  ["2timothy", 1, 7],
  ["hebrews", 11, 1],
  ["hebrews", 12, 2],
  ["james", 1, 5],
  ["1peter", 5, 7],
  ["1john", 1, 9],
  ["revelation", 21, 4],
];

/** Static hubs plus the curated collections that hang off them. */
export function pageEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/about", changefreq: "monthly", priority: "0.9" },
    { path: "/journeys", changefreq: "monthly", priority: "0.9" },
    { path: "/timeline", changefreq: "monthly", priority: "0.9" },
    { path: "/connections", changefreq: "monthly", priority: "0.8" },
    { path: "/concordance", changefreq: "weekly", priority: "0.9" },
    { path: "/people", changefreq: "weekly", priority: "0.9" },
    { path: "/places", changefreq: "weekly", priority: "0.9" },
    { path: "/install", changefreq: "monthly", priority: "0.6" },
    { path: "/whats-new", changefreq: "monthly", priority: "0.5" },
  ];

  for (const term of POPULAR_TERMS) {
    entries.push({ path: `/concordance/${termSlug(term)}`, changefreq: "monthly", priority: "0.6" });
  }
  for (const node of THREAD_NODES) {
    entries.push({ path: `/connections/${node.id}`, changefreq: "monthly", priority: "0.6" });
  }
  return entries;
}

/** Journey maps and each leg of multi-leg journeys. */
export function journeyEntries(): SitemapEntry[] {
  return JOURNEYS.flatMap((j) => [
    { path: `/journeys/${j.id}`, changefreq: "monthly" as const, priority: "0.8" },
    ...(j.legs.length > 1
      ? j.legs.map((l) => ({ path: `/journeys/${j.id}/${l.id}`, changefreq: "monthly" as const, priority: "0.8" }))
      : []),
  ]);
}

/** Curated person pages. Unpublished names are noindex, so they stay out. */
export function peopleEntries(): SitemapEntry[] {
  return [
    ...PUBLISHED_PEOPLE.map((p) => ({
      path: `/people/${p.slug}`,
      changefreq: "monthly" as const,
      priority: "0.7",
    })),
    ...familyTreeSlugs().map((slug) => ({
      path: `/people/${slug}/family-tree`,
      changefreq: "monthly" as const,
      priority: "0.6",
    })),
  ];
}

/** Curated place pages. Unpublished names are noindex, so they stay out. */
export function placesEntries(): SitemapEntry[] {
  return PUBLISHED_PLACES.map((p) => ({
    path: `/places/${p.slug}`,
    changefreq: "monthly" as const,
    priority: "0.7",
  }));
}

export function bookEntries(): SitemapEntry[] {
  return BOOKS.map((b) => ({
    path: `/${b.id}`,
    alt: `/${b.id}`,
    changefreq: "monthly" as const,
    priority: "0.8",
  }));
}

export function chapterEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const book of BOOKS) {
    for (let c = 1; c <= book.chapters; c++) {
      entries.push({ path: `/${book.id}/${c}`, alt: `/${book.id}/${c}`, changefreq: "monthly", priority: "0.7" });
    }
  }
  return entries;
}

export function chapterChunkCount(): number {
  return Math.max(1, Math.ceil(chapterEntries().length / CHAPTER_CHUNK_SIZE));
}

/** Every verse URL in the canon, curated references first at a higher priority. */
export function verseEntries(): SitemapEntry[] {
  const curated = new Set(POPULAR_VERSES.map(([b, c, v]) => `/${b}/${c}/${v}`));
  const entries: SitemapEntry[] = [];
  for (const book of BOOKS) {
    for (let c = 1; c <= book.chapters; c++) {
      const verses = versesInChapter(book.id, c);
      for (let v = 1; v <= verses; v++) {
        const path = `/${book.id}/${c}/${v}`;
        entries.push({
          path,
          changefreq: "yearly",
          priority: curated.has(path) ? "0.7" : "0.5",
        });
      }
    }
  }
  return entries;
}

export function verseChunkCount(): number {
  return Math.max(1, Math.ceil(verseEntries().length / VERSE_CHUNK_SIZE));
}

/** Names of every child sitemap, in the order the index lists them. */
export function sitemapSections(): string[] {
  const sections = ["pages", "journeys", "people", "places", "books"];
  for (let i = 1; i <= chapterChunkCount(); i++) sections.push(`chapters-${i}`);
  for (let i = 1; i <= verseChunkCount(); i++) sections.push(`verses-${i}`);
  for (const lang of LANG_CODES) {
    sections.push(`${lang}-books`);
    for (let i = 1; i <= chapterChunkCount(); i++) sections.push(`${lang}-chapters-${i}`);
    sections.push(`${lang}-verses`);
  }
  return sections;
}

/** Entries for a child sitemap, or null when the section name is unknown. */
export function entriesForSection(section: string): SitemapEntry[] | null {
  const langMatch = /^([a-z]{2})-(.+)$/.exec(section);
  if (langMatch && isLangCode(langMatch[1])) return langSection(langMatch[1], langMatch[2]);
  if (section === "pages") return pageEntries();
  if (section === "journeys") return journeyEntries();
  if (section === "people") return peopleEntries();
  if (section === "places") return placesEntries();
  if (section === "books") return bookEntries();
  const chunk = /^chapters-(\d+)$/.exec(section);
  if (chunk) {
    const index = Number(chunk[1]);
    if (index < 1 || index > chapterChunkCount()) return null;
    const all = chapterEntries();
    return all.slice((index - 1) * CHAPTER_CHUNK_SIZE, index * CHAPTER_CHUNK_SIZE);
  }
  const verseChunk = /^verses-(\d+)$/.exec(section);
  if (verseChunk) {
    const index = Number(verseChunk[1]);
    if (index < 1 || index > verseChunkCount()) return null;
    const all = verseEntries();
    return all.slice((index - 1) * VERSE_CHUNK_SIZE, index * VERSE_CHUNK_SIZE);
  }
  return null;
}


/** Language reader addresses: books, chapters and the curated popular verses. */
function langSection(lang: LangCode, rest: string): SitemapEntry[] | null {
  const prefix = (e: SitemapEntry): SitemapEntry => ({ ...e, path: `/${lang}${e.path}` });
  if (rest === "books") return bookEntries().map(prefix);
  if (rest === "verses") {
    return POPULAR_VERSES.map(([b, c, v]) =>
      prefix({ path: `/${b}/${c}/${v}`, alt: `/${b}/${c}/${v}`, changefreq: "yearly", priority: "0.5" }),
    );
  }
  const english = entriesForSection(rest);
  return rest.startsWith("chapters-") && english ? english.map(prefix) : null;
}

function alternateLinks(path: string): string[] {
  return [
    `    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${path}"/>`,
    ...LANG_CODES.map(
      (c) => `    <xhtml:link rel="alternate" hreflang="${htmlLang(c)}" href="${BASE_URL}/${c}${path}"/>`,
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${path}"/>`,
  ];
}

export function sitemapSectionUrl(section: string): string {
  return `${BASE_URL}/sitemaps/${section}.xml`;
}

export function renderUrlset(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      ...(e.alt ? alternateLinks(e.alt) : []),
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

export function renderSitemapIndex(sections: string[]): string {
  const items = sections.map((s) =>
    [`  <sitemap>`, `    <loc>${sitemapSectionUrl(s)}</loc>`, `  </sitemap>`].join("\n"),
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...items,
    `</sitemapindex>`,
  ].join("\n");
}

export const XML_HEADERS = {
  "Content-Type": "application/xml",
  "Cache-Control": "public, max-age=3600",
};
