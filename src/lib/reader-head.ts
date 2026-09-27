/**
 * Shared head metadata for reader routes.
 *
 * Both `/$book/$chapter` and `/$book/$chapter/$verse` render the same reader,
 * so they must advertise the same title, description, preview card and
 * structured data — only the canonical URL and the highlighted verse differ.
 */

import { getBook } from "@/lib/bible";
import { readerStructuredData } from "@/lib/structured-data";
import { verseCardUrl } from "@/lib/share";
import {
  OG_DESCRIPTION_MAX,
  fitOnWordBoundary,
  verseShareDescription,
  verseShareTitle,
} from "@/lib/share-meta";

import { SITE_URL as SITE } from "@/lib/site";
import { LANG_META } from "@/lib/i18n-meta";
import { LANG_ROUTES, htmlLang, readerAlternates, type LangCode } from "@/lib/lang-routes";
import { TRANSLATIONS } from "@/lib/translations";

export function buildReaderHead(opts: {
  bookId: string;
  bookName: string;
  chapter: number | string;
  /** Verse to feature in the preview, from the path or the ?v= parameter. */
  verse?: number | null;
  verseText?: string | null;
  /** True when the verse is part of the URL path (permanent verse link). */
  verseInPath?: boolean;
  /**
   * Set on the chapter route when a verse route is matched beneath it: link
   * tags concatenate across matches, so only the leaf may emit a canonical.
   */
  omitCanonical?: boolean;
  /** Language address (`/yo/...`); English when absent. */
  lang?: LangCode;
}) {
  const lang = opts.lang;
  const t = lang ? LANG_META[lang] : undefined;
  const { bookId, bookName, chapter, verse, verseText, verseInPath } = opts;
  // Only a verse in the path gets verse-led metadata. A ?v= highlight on the
  // chapter route keeps chapter-led copy so the two URLs never share a title.
  const featured = verse && verseInPath ? verse : null;
  const reference = featured ? `${bookName} ${chapter}:${featured}` : `${bookName} ${chapter}`;
  // Keep titles under the 60-character search limit by using the short brand.
  const siteName = "Bible Atlas";
  const rawTitle = featured
    ? fitOnWordBoundary(verseShareTitle(reference, siteName), 60)
    : fitOnWordBoundary(
        t ? t.chapter(reference) : `${reference} — read the full chapter | ${siteName}`,
        60,
      );
  const rawDescription =
    featured && verseText
      ? verseShareDescription(verseText, reference)
      : fitOnWordBoundary(
          t
            ? t.chapterDesc(reference)
            : `Read ${reference} with maps, timelines, family trees, 3D artefacts, and thematic connections next to the verse you're reading.`,
          OG_DESCRIPTION_MAX,
        );
  const { title, description } = langSearchCopy(lang, rawTitle, rawDescription);
  // Search engines clip descriptions near 160 chars; social cards allow more.
  const searchDescription = fitOnWordBoundary(description, 160);
  const prefix = lang ? `/${lang}` : "";
  const chapterPath = `/${bookId}/${chapter}`;
  const chapterUrl = `${SITE}${prefix}${chapterPath}`;
  const leafPath = featured ? `${chapterPath}/${featured}` : chapterPath;
  const canonical = featured ? `${chapterUrl}/${featured}` : chapterUrl;
  const url = verse ? (verseInPath ? canonical : `${chapterUrl}?v=${verse}`) : chapterUrl;
  const image = verseCardUrl({
    book: String(bookId),
    chapter: Number(chapter),
    verse: featured ?? undefined,
    reference,
    text: (featured && verseText) || undefined,
  });

  const { ogTitle, ogDescription } = langSocialCopy(lang, title, description);
  return {
    meta: [
      { title },
      { name: "description", content: searchDescription },
      { property: "og:site_name", content: "Bible Atlas" },
      { property: "og:locale", content: t?.locale ?? "en_US" },
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:type", content: "article" },
      { property: "article:section", content: bookName },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: `${reference} — Bible Atlas` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@bibleatlas" },
      { name: "twitter:title", content: ogTitle },
      { name: "twitter:description", content: ogDescription },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: `${reference} — Bible Atlas` },
    ],

    links: opts.omitCanonical
      ? []
      : [{ rel: "canonical", href: canonical }, ...readerAlternates(leafPath)],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          withLanguage(readerStructuredData({
            bookId: String(bookId),
            bookName,
            chapters: getBook(String(bookId))?.chapters,
            chapter,
            verse: featured,
            verseText: featured ? verseText : null,
            description,
            image,
          }), htmlLang(lang)),
        ).replace(lang ? new RegExp(`"${SITE}/(?!#|"|api/|og/)`, "g") : /$^/, `"${SITE}/${lang}/`),
      },
    ],

  };
}

/** Stamp `inLanguage` on every node of a JSON-LD graph. */
function withLanguage<T>(data: T, language: string): T {
  const d = data as { "@graph"?: Record<string, unknown>[] } & Record<string, unknown>;
  const nodes = d["@graph"] ?? [d];
  for (const n of nodes) if (n && typeof n === "object" && n["@type"] !== "BreadcrumbList") n.inLanguage = language;
  return data;
}

/**
 * Social-card copy for language addresses: names the exact translation so a
 * shared French, Yoruba or Chinese link never previews like its siblings.
 */
export function langSocialCopy(lang: LangCode | undefined, title: string, description: string) {
  if (!lang) return { ogTitle: title, ogDescription: description };
  const tr = TRANSLATIONS.find((x) => x.id === LANG_ROUTES[lang]);
  if (!tr) return { ogTitle: title, ogDescription: description };
  const base = title.replace(/\s*\|\s*Bible Atlas$/, "");
  const ogTitle = fitOnWordBoundary(`${base} · ${tr.name} | Bible Atlas`, 95);
  const ogDescription = description.includes(tr.name)
    ? description
    : fitOnWordBoundary(`${tr.name} (${tr.label}) — ${description}`, OG_DESCRIPTION_MAX);
  return { ogTitle, ogDescription };
}

/** Search title/description for language addresses, naming the translation. */
export function langSearchCopy(lang: LangCode | undefined, title: string, description: string) {
  if (!lang) return { title, description };
  const tr = TRANSLATIONS.find((x) => x.id === LANG_ROUTES[lang]);
  if (!tr) return { title, description };
  const base = title.replace(/\s*[|—]\s*Bible Atlas$/, "");
  let t = `${base} (${tr.label}) | Bible Atlas`;
  if (t.length > 60) t = `${base.split(" — ")[0]} (${tr.label}) | Bible Atlas`;
  const d = [tr.label, tr.name, tr.name.split(/[\s(]/)[0]].some((n) => description.includes(n))
    ? description
    : fitOnWordBoundary(`${tr.label}: ${description}`, 160);
  return { title: fitOnWordBoundary(t, 60), description: d };
}
