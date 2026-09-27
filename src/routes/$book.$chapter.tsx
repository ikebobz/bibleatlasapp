import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { LangAddressSync } from "@/components/reader/LangAddressSync";
import { langForTranslation } from "@/lib/lang-routes";
import { Outlet, useChildMatches, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { ChapterReader } from "@/components/reader/ChapterReader";
import { storedTranslation } from "@/components/reader/settings";
import { chapterErrorReason, chapterQuery } from "@/lib/chapter-query";
import { OfflineChapterNotice } from "@/components/reader/OfflineChapterNotice";
import { getBook } from "@/lib/bible";
import {
  DEFAULT_TRANSLATION,
  TRANSLATION_IDS,
  deepLinkTranslation,
  defaultTranslationForLanguage,
} from "@/lib/translations";
import { buildReaderHead } from "@/lib/reader-head";


const searchSchema = z.object({
  ref: z.string().optional(),
  v: z.coerce.number().int().optional(),
  /** Translation carried on a shared link. */
  t: z.enum(TRANSLATION_IDS).optional().catch(undefined),
  /** Language deep link (?lang=yo) — resolves to that language's default text. */
  lang: z.string().optional(),
  /** Marks a share-sourced arrival. */
  s: z.string().optional(),
  /** Set by the landing-page CTA — shows the one-time guided tip. */
  tour: z.coerce.number().int().optional(),
});

export const Route = createFileRoute("/$book/$chapter")({
  validateSearch: searchSchema,
  // `?lang=yo` links from before language addresses existed move permanently
  // to `/yo/...` (this also runs for the nested verse route).
  beforeLoad: ({ search, location }) => {
    if (search.t || !search.lang) return;
    const code = langForTranslation(defaultTranslationForLanguage(search.lang));
    if (!code) return;
    const rest = new URLSearchParams();
    for (const [k, val] of Object.entries(search)) {
      if (k !== "lang" && val !== undefined) rest.set(k, String(val));
    }
    const qs = rest.toString();
    throw redirect({ href: `/${code}${location.pathname}${qs ? `?${qs}` : ""}`, statusCode: 301 });
  },
  loaderDeps: ({ search }) => ({ v: search.v, t: search.t, lang: search.lang }),
  loader: async ({ context, params, deps }) => {
    const book = getBook(params.book);
    const chapter = Number(params.chapter);
    if (!book || !Number.isFinite(chapter) || chapter < 1 || chapter > book.chapters) {
      throw notFound();
    }
    // A link's version or language wins; otherwise follow the version this
    // device is actually reading in, so loader and reader never disagree.
    const translation =
      deepLinkTranslation(deps.t, deps.lang) ?? storedTranslation() ?? DEFAULT_TRANSLATION;
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
  head: ({ loaderData, params, matches }) =>
    buildReaderHead({
      bookId: params.book,
      bookName: loaderData?.bookName ?? getBook(params.book)?.name ?? "Scripture",
      chapter: loaderData?.chapter ?? params.chapter,
      verse: loaderData?.sharedVerse?.number,
      verseText: loaderData?.sharedVerse?.text,
      // The verse route beneath us emits its own canonical; two would be invalid.
      omitCanonical: matches.some((m) => String(m.routeId) === "/$book/$chapter/$verse"),
    }),

  component: ChapterRoute,
  errorComponent: ChapterUnavailable,
  notFoundComponent: ChapterNotFound,
});

function ChapterNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="scripture text-2xl text-foreground">That chapter doesn’t exist</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Check the book name and chapter number, or start reading from the beginning.
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


function ChapterUnavailable({ error }: { error: unknown }) {
  const router = useRouter();
  return (
    <OfflineChapterNotice
      reason={chapterErrorReason(error) ?? "network"}
      onRetry={() => void router.invalidate()}
    />
  );
}


function ChapterRoute() {
  const params = Route.useParams();
  const { ref, v, t, lang, s, tour } = Route.useSearch();
  // `/john/4/12` nests the verse route under this one; hand rendering over so the
  // verse route's reader (with its focus treatment) actually mounts.
  const childMatches = useChildMatches();
  const book = getBook(params.book)!;
  if (childMatches.length > 0) return <Outlet />;
  return (
    <>
    <LangAddressSync />
    <ChapterReader
      book={book.id}
      chapter={Number(params.chapter)}
      initialRef={ref}
      highlightVerse={v}
      linkTranslation={deepLinkTranslation(t, lang)}
      sharedArrival={s === "share"}
      tour={tour === 1}
    />
    </>
  );
}
