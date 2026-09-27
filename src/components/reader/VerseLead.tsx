/**
 * Verse-first header for `/book/chapter/verse` URLs.
 *
 * A verse URL used to render exactly what its chapter URL renders, so search
 * engines folded the two together. This block gives the verse page its own H1,
 * its own quoted text, and unique supporting content (other translations,
 * neighbouring verses) so it can rank for "John 3:16"-style searches.
 */

import { Link } from "@tanstack/react-router";

import { versesInChapter } from "@/lib/verse-counts.generated";

export type VerseComparison = { id: string; name: string; text: string };

export function VerseLead({
  bookId,
  bookName,
  chapter,
  verse,
  verseText,
  versionName,
  comparisons = [],
}: {
  bookId: string;
  bookName: string;
  chapter: number;
  verse: number;
  verseText: string;
  versionName: string;
  comparisons?: VerseComparison[];
}) {
  const reference = `${bookName} ${chapter}:${verse}`;
  const total = versesInChapter(bookId, chapter);
  const prev = verse > 1 ? verse - 1 : null;
  const next = total && verse < total ? verse + 1 : null;

  return (
    <header className="mb-10">
      <nav aria-label="Breadcrumb" className="text-[11px] text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link to="/" className="hover:text-foreground">
              Bible Atlas
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link to="/$book" params={{ book: bookId }} className="hover:text-foreground">
              {bookName}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link
              to="/$book/$chapter"
              params={{ book: bookId, chapter: String(chapter) }}
              className="hover:text-foreground"
            >
              {bookName} {chapter}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li aria-current="page" className="text-foreground">
            Verse {verse}
          </li>
        </ol>
      </nav>

      <h1 className="scripture mt-3 text-4xl leading-none text-foreground">{reference}</h1>

      <blockquote className="scripture mt-4 border-l-2 border-primary/40 pl-4 text-lg text-foreground">
        <p>“{verseText}”</p>
        <cite className="mt-2 block not-italic text-xs text-muted-foreground">
          {reference} — {versionName}
        </cite>
      </blockquote>

      <p className="mt-3 text-xs text-muted-foreground">
        {total ? `Verse ${verse} of ${total} in ` : "In "}
        {bookName} chapter {chapter} — {versionName}. Read it in context below, with maps,
        timelines and thematic connections beside the text.
      </p>

      {comparisons.length > 0 && (
        <section aria-labelledby="verse-translations-heading" className="mt-6">
          <h2
            id="verse-translations-heading"
            className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary"
          >
            {reference} in other translations
          </h2>
          <dl className="mt-3 space-y-3">
            {comparisons.map((c) => (
              <div key={c.id}>
                <dt className="text-xs text-muted-foreground">{c.name}</dt>
                <dd className="scripture text-foreground">“{c.text}”</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <nav aria-label="Nearby verses" className="mt-6 flex flex-wrap gap-2 text-sm">
        {prev && (
          <Link
            to="/$book/$chapter/$verse"
            params={{ book: bookId, chapter: String(chapter), verse: String(prev) }}
            className="rounded-full border px-3 py-1 text-foreground transition-colors hover:bg-muted"
          >
            ← {bookName} {chapter}:{prev}
          </Link>
        )}
        <Link
          to="/$book/$chapter"
          params={{ book: bookId, chapter: String(chapter) }}
          className="rounded-full border px-3 py-1 text-foreground transition-colors hover:bg-muted"
        >
          Read the whole chapter
        </Link>
        {next && (
          <Link
            to="/$book/$chapter/$verse"
            params={{ book: bookId, chapter: String(chapter), verse: String(next) }}
            className="rounded-full border px-3 py-1 text-foreground transition-colors hover:bg-muted"
          >
            {bookName} {chapter}:{next} →
          </Link>
        )}
      </nav>
    </header>
  );
}

/** Crawlable links from a chapter to every one of its verse pages. */
export function VerseIndex({
  bookId,
  bookName,
  chapter,
  verses,
}: {
  bookId: string;
  bookName: string;
  chapter: number;
  verses: number[];
}) {
  return (
    <section aria-labelledby="verse-index-heading" className="mt-12 border-t pt-6">
      <h2 id="verse-index-heading" className="text-xs font-semibold text-foreground">
        Every verse in {bookName} {chapter}
      </h2>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {verses.map((n) => (
          <li key={n}>
            <Link
              to="/$book/$chapter/$verse"
              params={{ book: bookId, chapter: String(chapter), verse: String(n) }}
              title={`${bookName} ${chapter}:${n}`}
              className="inline-flex min-w-7 justify-center rounded border px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {n}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
