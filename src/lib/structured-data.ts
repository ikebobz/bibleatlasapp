/**
 * Shared JSON-LD builders for the book → chapter → verse hierarchy.
 *
 * Every entity carries a stable `@id` so search engines can link a verse to its
 * chapter, a chapter to its book, and the book back to the sitewide WebSite
 * graph declared in `src/routes/__root.tsx`.
 */

export { SITE_URL } from "@/lib/site";
import { SITE_URL } from "@/lib/site";
const WEBSITE_ID = `${SITE_URL}/#website`;
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** Structured data for the homepage: the reading entry point plus site search. */
export function homeStructuredData(opts: { title: string; description: string; image?: string }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: opts.title,
        description: opts.description,
        inLanguage: "en",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        isAccessibleForFree: true,
        ...(opts.image ? { primaryImageOfPage: opts.image } : {}),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: "Bible Atlas",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/concordance/{search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      breadcrumbs([{ name: "Bible Atlas", item: SITE_URL }]),
    ],
  };
}


export function bookUrl(bookId: string) {
  return `${SITE_URL}/${bookId}`;
}

export function chapterUrl(bookId: string, chapter: number | string) {
  return `${bookUrl(bookId)}/${chapter}`;
}

export function verseUrlFor(bookId: string, chapter: number | string, verse: number) {
  return `${chapterUrl(bookId, chapter)}/${verse}`;
}

type Crumb = { name: string; item: string };

function breadcrumbs(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  };
}

function bookEntity(opts: { bookId: string; bookName: string; chapters: number }) {
  return {
    "@type": "Book",
    "@id": `${bookUrl(opts.bookId)}#book`,
    name: opts.bookName,
    url: bookUrl(opts.bookId),
    bookFormat: "https://schema.org/EBook",
    numberOfPages: opts.chapters,
    inLanguage: "en",
    isAccessibleForFree: true,
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };

}

function chapterEntity(opts: {
  bookId: string;
  bookName: string;
  chapter: number | string;
  description: string;
  image?: string;
}) {
  return {
    "@type": "Chapter",
    "@id": `${chapterUrl(opts.bookId, opts.chapter)}#chapter`,
    name: `${opts.bookName} ${opts.chapter}`,
    url: chapterUrl(opts.bookId, opts.chapter),
    position: Number(opts.chapter) || undefined,
    description: opts.description,
    ...(opts.image ? { image: opts.image } : {}),
    inLanguage: "en",
    isAccessibleForFree: true,
    publisher: { "@id": ORGANIZATION_ID },
    isPartOf: { "@id": `${bookUrl(opts.bookId)}#book` },
  };

}

/** Structured data for a book landing page. */
export function bookStructuredData(opts: {
  bookId: string;
  bookName: string;
  chapters: number;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...bookEntity(opts),
        description: opts.description,
        hasPart: Array.from({ length: opts.chapters }, (_, i) => ({
          "@type": "Chapter",
          "@id": `${chapterUrl(opts.bookId, i + 1)}#chapter`,
          name: `${opts.bookName} ${i + 1}`,
          position: i + 1,
          url: chapterUrl(opts.bookId, i + 1),
        })),
      },
      breadcrumbs([
        { name: "Bible Atlas", item: SITE_URL },
        { name: opts.bookName, item: bookUrl(opts.bookId) },
      ]),
    ],
  };
}

/** Structured data for a chapter page, or a verse page when `verse` is set. */
export function readerStructuredData(opts: {
  bookId: string;
  bookName: string;
  chapters?: number;
  chapter: number | string;
  verse?: number | null;
  verseText?: string | null;
  description: string;
  image?: string;
}) {
  const { bookId, bookName, chapter, verse, verseText, description, image } = opts;
  const chapterNode = chapterEntity({ bookId, bookName, chapter, description, image });

  const graph: Record<string, unknown>[] = [
    bookEntity({ bookId, bookName, chapters: opts.chapters ?? Number(chapter) }),
    chapterNode,
  ];

  if (verse) {
    graph.push({
      "@type": "CreativeWork",
      "@id": `${verseUrlFor(bookId, chapter, verse)}#verse`,
      name: `${bookName} ${chapter}:${verse}`,
      url: verseUrlFor(bookId, chapter, verse),
      position: verse,
      inLanguage: "en",
      isAccessibleForFree: true,
      publisher: { "@id": ORGANIZATION_ID },
      isPartOf: { "@id": chapterNode["@id"] },
      citation: `${bookName} ${chapter}:${verse}`,
      ...(verseText ? { text: verseText } : {}),
    });
  }


  graph.push(
    breadcrumbs([
      { name: "Bible Atlas", item: SITE_URL },
      { name: bookName, item: bookUrl(bookId) },
      { name: `Chapter ${chapter}`, item: chapterUrl(bookId, chapter) },
      ...(verse
        ? [{ name: `Verse ${verse}`, item: verseUrlFor(bookId, chapter, verse) }]
        : []),
    ]),
  );

  return { "@context": "https://schema.org", "@graph": graph };
}
