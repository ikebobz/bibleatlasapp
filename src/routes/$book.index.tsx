import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { SECTION_LABEL, getBook, getBookByNumber, type BookMeta } from "@/lib/bible";
import { fitOnWordBoundary } from "@/lib/share-meta";
import { bookStructuredData, bookUrl } from "@/lib/structured-data";
import { readerAlternates } from "@/lib/lang-routes";

export const Route = createFileRoute("/$book/")({
  loader: ({ params }) => {
    const book = getBook(params.book);
    if (!book) throw notFound();
    return { book };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Book not found — Bible Atlas" }, { name: "robots", content: "noindex" }],
      };
    }
    const { book } = loaderData;
    const url = bookUrl(params.book);
    const title = fitOnWordBoundary(
      `${book.name} — read all ${book.chapters} chapters | Bible Atlas`,
      60,
    );
    const description = fitOnWordBoundary(
      `Read every chapter of ${book.name} (${SECTION_LABEL[book.section]}, ${
        book.testament === "old" ? "Old" : "New"
      } Testament) with maps, timelines, family trees and thematic connections beside the text.`,
      160,
    );
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "book" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }, ...readerAlternates(`/${book.id}`)],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            bookStructuredData({
              bookId: book.id,
              bookName: book.name,
              chapters: book.chapters,
              description,
            }),
          ),
        },
      ],
    };
  },
  component: BookPage,
  notFoundComponent: BookNotFound,
});

function BookNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="scripture text-2xl text-foreground">That book doesn’t exist</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Check the book name, or start reading from the beginning.
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

function BookPage() {
  const { book } = Route.useLoaderData() as { book: BookMeta };
  const prev = getBookByNumber(book.num - 1);
  const next = getBookByNumber(book.num + 1);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {book.testament === "old" ? "Old" : "New"} Testament · {SECTION_LABEL[book.section]}
      </p>
      <h1 className="scripture mt-2 text-4xl text-foreground">{book.name}</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        {book.chapters} chapters. Read {book.name} with maps, timelines, family trees, 3D artefacts
        and thematic connections appearing right beside the verse you are reading.
      </p>

      <h2 className="mt-10 text-sm font-medium text-foreground">Chapters</h2>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-2">
        {Array.from({ length: book.chapters }, (_, i) => i + 1).map((c) => (
          <li key={c}>
            <Link
              to="/$book/$chapter"
              params={{ book: book.id, chapter: String(c) }}
              className="flex h-12 items-center justify-center rounded-lg border text-sm text-foreground transition-colors hover:bg-muted"
              aria-label={`${book.name} chapter ${c}`}
            >
              {c}
            </Link>
          </li>
        ))}
      </ul>

      <nav className="mt-12 flex flex-wrap justify-between gap-3 border-t pt-6 text-sm">
        {prev ? (
          <Link
            to="/$book"
            params={{ book: prev.id }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to="/$book"
            params={{ book: next.id }}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {next.name} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
