/**
 * Route options shared by every language reader address (`/yo/genesis/1`).
 * Each `src/routes/<lang>.*.tsx` file is a one-liner over these factories so
 * all nine languages behave identically to the English reader.
 */

import {
  Outlet,
  notFound,
  useChildMatches,
  useLoaderData,
  useParams,
  useRouter,
  useSearch,
} from "@tanstack/react-router";
import { z } from "zod";

import { ChapterReader } from "@/components/reader/ChapterReader";
import { OfflineChapterNotice } from "@/components/reader/OfflineChapterNotice";
import { LangAddressSync } from "@/components/reader/LangAddressSync";
import { TranslationPin } from "@/components/reader/settings";
import { chapterErrorReason, chapterQuery } from "@/lib/chapter-query";
import { BOOKS, SECTION_LABEL, getBook } from "@/lib/bible";
import { buildReaderHead, langSearchCopy, langSocialCopy } from "@/lib/reader-head";
import { fitOnWordBoundary } from "@/lib/share-meta";
import { bookStructuredData } from "@/lib/structured-data";
import { LANG_META } from "@/lib/i18n-meta";
import { LANG_ROUTES, htmlLang, readerAlternates, type LangCode } from "@/lib/lang-routes";
import { SITE_URL } from "@/lib/site";
import type { QueryClient } from "@tanstack/react-query";

const searchSchema = z.object({
  ref: z.string().optional(),
  v: z.coerce.number().int().optional(),
  s: z.string().optional(),
});

type Ctx = { context: { queryClient: QueryClient }; params: Record<string, string> };

function NotFoundBlock({ what }: { what: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="scripture text-2xl text-foreground">That {what} doesn’t exist</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Check the reference, or start reading from the beginning.
        </p>
        <a
          href="/genesis/1"
          className="mt-6 inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          Open Genesis 1
        </a>
      </div>
    </div>
  );
}

function Unavailable({ error }: { error: unknown }) {
  const router = useRouter();
  return (
    <OfflineChapterNotice
      reason={chapterErrorReason(error) ?? "network"}
      onRetry={() => void router.invalidate()}
    />
  );
}

const noindex = { meta: [{ title: "Not found — Bible Atlas" }, { name: "robots", content: "noindex" }] };

/* ------------------------------- Book page ------------------------------- */

export function langBookRoute(lang: LangCode) {
  const t = LANG_META[lang];
  return {
    loader: ({ params }: Pick<Ctx, "params">) => {
      const book = getBook(params.book);
      if (!book) throw notFound();
      return { bookId: book.id };
    },
    head: ({ loaderData }: { loaderData?: { bookId: string } }) => {
      const book = loaderData && getBook(loaderData.bookId);
      if (!book) return noindex;
      const url = `${SITE_URL}/${lang}/${book.id}`;
      const { title, description } = langSearchCopy(
        lang,
        fitOnWordBoundary(t.book(book.name, book.chapters), 60),
        fitOnWordBoundary(t.bookDesc(book.name, book.chapters), 160),
      );
      const ld = bookStructuredData({
        bookId: book.id,
        bookName: book.name,
        chapters: book.chapters,
        description,
      }) as Record<string, unknown>;
      const social = langSocialCopy(lang, title, description);
      return {
        meta: [
          { title },
          { name: "description", content: description },
          { property: "og:title", content: social.ogTitle },
          { property: "og:description", content: social.ogDescription },
          { property: "og:type", content: "book" },
          { property: "og:locale", content: t.locale },
          { property: "og:url", content: url },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: social.ogTitle },
          { name: "twitter:description", content: social.ogDescription },
        ],
        links: [{ rel: "canonical", href: url }, ...readerAlternates(`/${book.id}`)],
        scripts: [
          {
            type: "application/ld+json",
            children: JSON.stringify({ ...ld, inLanguage: htmlLang(lang) }).replace(
              new RegExp(`"${SITE_URL}/(?!#|"|api/|og/)`, "g"),
              `"${SITE_URL}/${lang}/`,
            ),
          },
        ],
      };
    },
    component: function LangBookPage() {
      const { bookId } = useLoaderData({ strict: false }) as { bookId: string };
      const book = getBook(bookId)!;
      const prev = BOOKS[BOOKS.indexOf(book) - 1];
      const next = BOOKS[BOOKS.indexOf(book) + 1];
      return (
        <main lang={htmlLang(lang)} className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {book.testament === "old" ? "Old" : "New"} Testament · {SECTION_LABEL[book.section]}
          </p>
          <h1 className="scripture mt-2 text-4xl text-foreground">{book.name}</h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {t.bookDesc(book.name, book.chapters)}
          </p>
          <ul className="mt-10 grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-2">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
              <li key={c}>
                <a
                  href={`/${lang}/${book.id}/${c}`}
                  className="flex h-12 items-center justify-center rounded-lg border text-sm text-foreground transition-colors hover:bg-muted"
                  aria-label={`${book.name} ${c}`}
                >
                  {c}
                </a>
              </li>
            ))}
          </ul>
          <nav className="mt-12 flex flex-wrap justify-between gap-3 border-t pt-6 text-sm">
            {prev ? (
              <a href={`/${lang}/${prev.id}`} className="text-muted-foreground hover:text-foreground">
                ← {prev.name}
              </a>
            ) : (
              <span />
            )}
            {next ? (
              <a href={`/${lang}/${next.id}`} className="text-muted-foreground hover:text-foreground">
                {next.name} →
              </a>
            ) : (
              <span />
            )}
          </nav>
        </main>
      );
    },
    notFoundComponent: () => <NotFoundBlock what="book" />,
  };
}

/* ------------------------------ Chapter page ----------------------------- */

export function langChapterRoute(lang: LangCode, verseRouteId: string) {
  const translation = LANG_ROUTES[lang];
  return {
    validateSearch: searchSchema,
    loaderDeps: ({ search }: { search: z.infer<typeof searchSchema> }) => ({ v: search.v }),
    loader: async ({ context, params, deps }: Ctx & { deps: { v?: number } }) => {
      const book = getBook(params.book);
      const chapter = Number(params.chapter);
      if (!book || !Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) {
        throw notFound();
      }
      const data = await context.queryClient.ensureQueryData(
        chapterQuery(book.id, chapter, translation),
      );
      const shared = deps.v ? data.verses.find((x) => x.number === deps.v) : undefined;
      return {
        bookName: book.name,
        chapter,
        sharedVerse: shared ? { number: shared.number, text: shared.text } : null,
      };
    },
    head: ({
      loaderData,
      params,
      matches,
    }: {
      loaderData?: { bookName: string; chapter: number; sharedVerse: { number: number; text: string } | null };
      params: Record<string, string>;
      matches: { routeId: unknown }[];
    }) => {
      if (!loaderData && !getBook(params.book)) return noindex;
      return buildReaderHead({
        lang,
        bookId: params.book,
        bookName: loaderData?.bookName ?? getBook(params.book)?.name ?? "Scripture",
        chapter: loaderData?.chapter ?? params.chapter,
        verse: loaderData?.sharedVerse?.number,
        verseText: loaderData?.sharedVerse?.text,
        omitCanonical: matches.some((m) => String(m.routeId) === verseRouteId),
      });
    },
    component: function LangChapter() {
      const params = useParams({ strict: false }) as { book: string; chapter: string };
      const { ref, v, s } = useSearch({ strict: false }) as z.infer<typeof searchSchema>;
      const childMatches = useChildMatches();
      if (childMatches.length > 0) return <Outlet />;
      const book = getBook(params.book)!;
      return (
        <TranslationPin translation={translation}><div lang={htmlLang(lang)}>
          <LangAddressSync lang={lang} />
          <ChapterReader
            book={book.id}
            chapter={Number(params.chapter)}
            initialRef={ref}
            highlightVerse={v}
            linkTranslation={translation}
            sharedArrival={s === "share"}
          />
        </div></TranslationPin>
      );
    },
    errorComponent: Unavailable,
    notFoundComponent: () => <NotFoundBlock what="chapter" />,
  };
}

/* ------------------------------- Verse page ------------------------------ */

export function langVerseRoute(lang: LangCode) {
  const translation = LANG_ROUTES[lang];
  return {
    validateSearch: searchSchema,
    loader: async ({ context, params }: Ctx) => {
      const book = getBook(params.book);
      const chapter = Number(params.chapter);
      const verse = Number(params.verse);
      if (
        !book ||
        !Number.isFinite(chapter) ||
        chapter < 1 ||
        chapter > book.chapters ||
        !Number.isFinite(verse) ||
        verse < 1
      ) {
        throw notFound();
      }
      const data = await context.queryClient.ensureQueryData(
        chapterQuery(book.id, chapter, translation),
      );
      const match = data.verses.find((x) => x.number === verse);
      return {
        bookId: book.id,
        bookName: book.name,
        chapter,
        verse: match ? verse : null,
        verseText: match?.text ?? null,
      };
    },
    head: ({
      loaderData,
      params,
    }: {
      loaderData?: { bookId: string; bookName: string; chapter: number; verse: number | null; verseText: string | null };
      params: Record<string, string>;
    }) => {
      if (!loaderData && !getBook(params.book)) return noindex;
      return buildReaderHead({
        lang,
        bookId: loaderData?.bookId ?? params.book,
        bookName: loaderData?.bookName ?? getBook(params.book)?.name ?? "Scripture",
        chapter: loaderData?.chapter ?? params.chapter,
        verse: loaderData?.verse ?? Number(params.verse),
        verseText: loaderData?.verseText,
        verseInPath: true,
      });
    },
    component: function LangVerse() {
      const params = useParams({ strict: false }) as { book: string; chapter: string; verse: string };
      const { ref, s } = useSearch({ strict: false }) as z.infer<typeof searchSchema>;
      const book = getBook(params.book)!;
      return (
        <TranslationPin translation={translation}><div lang={htmlLang(lang)}>
          <LangAddressSync lang={lang} />
          <ChapterReader
            book={book.id}
            chapter={Number(params.chapter)}
            initialRef={ref}
            highlightVerse={Number(params.verse)}
            versePath
            linkTranslation={translation}
            sharedArrival={s === "share"}
          />
        </div></TranslationPin>
      );
    },
    errorComponent: Unavailable,
    notFoundComponent: () => <NotFoundBlock what="verse" />,
  };
}
