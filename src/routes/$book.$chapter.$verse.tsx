import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { z } from "zod";

import { ChapterReader } from "@/components/reader/ChapterReader";
import { LangAddressSync } from "@/components/reader/LangAddressSync";
import { OfflineChapterNotice } from "@/components/reader/OfflineChapterNotice";
import { storedTranslation } from "@/components/reader/settings";
import { chapterErrorReason, chapterQuery } from "@/lib/chapter-query";
import { getBook } from "@/lib/bible";
import { buildReaderHead } from "@/lib/reader-head";
import { DEFAULT_TRANSLATION, TRANSLATION_IDS, deepLinkTranslation, getTranslation } from "@/lib/translations";

const searchSchema = z.object({
  ref: z.string().optional(),
  t: z.enum(TRANSLATION_IDS).optional().catch(undefined),
  /** Language deep link (?lang=yo) — resolves to that language's default text. */
  lang: z.string().optional(),
  s: z.string().optional(),
});

export const Route = createFileRoute("/$book/$chapter/$verse")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ t: search.t, lang: search.lang }),
  loader: async ({ context, params, deps }) => {
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
    const translation =
      deepLinkTranslation(deps.t, deps.lang) ?? storedTranslation() ?? DEFAULT_TRANSLATION;
    const data = await context.queryClient.ensureQueryData(
      chapterQuery(book.id, chapter, translation),
    );
    const match = data.verses.find((v) => v.number === verse);

    // The same verse in the other core public-domain translations. This is the
    // unique, server-rendered content that makes a verse page more than a copy
    // of its chapter. Failures are ignored — the page still reads fine.
    const others = (["kjv", "web", "asv"] as const).filter((id) => id !== translation);
    // Comparisons are a bonus, never worth stalling the SSR stream for.
    const settled = await Promise.race([
      Promise.allSettled(
        others.map((id) => context.queryClient.ensureQueryData(chapterQuery(book.id, chapter, id))),
      ),
      new Promise<PromiseSettledResult<never>[]>((resolve) =>
        setTimeout(() => resolve(others.map(() => ({ status: "rejected", reason: "timeout" }))), 3000),
      ),
    ]);
    const comparisons = settled.flatMap((result, i) => {
      if (result.status !== "fulfilled") return [];
      const text = result.value.verses.find((v) => v.number === verse)?.text;
      if (!text) return [];
      return [{ id: others[i], name: getTranslation(others[i]).name, text }];
    });

    return {
      bookId: book.id,
      bookName: book.name,
      chapter,
      // An out-of-range verse still reads the chapter, just without a highlight.
      verse: match ? verse : null,
      verseText: match?.text ?? null,
      comparisons,
    };
  },

  head: ({ loaderData, params }) =>
    buildReaderHead({
      bookId: loaderData?.bookId ?? params.book,
      bookName: loaderData?.bookName ?? getBook(params.book)?.name ?? "Scripture",
      chapter: loaderData?.chapter ?? params.chapter,
      verse: loaderData?.verse ?? Number(params.verse),
      verseText: loaderData?.verseText,
      verseInPath: true,
    }),
  component: VerseRoute,
  errorComponent: VerseUnavailable,
  notFoundComponent: VerseNotFound,
});

function VerseNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="scripture text-2xl text-foreground">That verse doesn’t exist</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Check the book, chapter and verse numbers, or start reading from the beginning.
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

function VerseUnavailable({ error }: { error: unknown }) {
  const router = useRouter();
  return (
    <OfflineChapterNotice
      reason={chapterErrorReason(error) ?? "network"}
      onRetry={() => void router.invalidate()}
    />
  );
}

function VerseRoute() {
  const params = Route.useParams();
  const { ref, t, lang, s } = Route.useSearch();
  const { comparisons } = Route.useLoaderData();
  const book = getBook(params.book)!;
  return (
    <>
    <LangAddressSync />
    <ChapterReader
      book={book.id}
      chapter={Number(params.chapter)}
      initialRef={ref}
      highlightVerse={Number(params.verse)}
      versePath
      comparisons={comparisons}
      linkTranslation={deepLinkTranslation(t, lang)}
      sharedArrival={s === "share"}
    />
    </>
  );
}

