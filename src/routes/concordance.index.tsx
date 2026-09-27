import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, BookOpen, Flame } from "lucide-react";

import { ConcordanceSearch } from "@/components/concordance/ConcordanceSearch";
import { concordanceTrending } from "@/lib/concordance/search.functions";
import { FEATURED_GROUPS, termSlug } from "@/lib/concordance/terms";

import { SITE_URL as SITE } from "@/lib/site";

const TITLE = "Bible Concordance (KJV) — Search Every Word | Bible Atlas";
const DESCRIPTION =
  "Search any word in the KJV and see every verse, how often it appears in each book, and the maps, timelines and connections behind it.";

export const Route = createFileRoute("/concordance/")({
  head: () => {
    const url = `${SITE}/concordance`;
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: TITLE },
        { name: "twitter:description", content: DESCRIPTION },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Bible Atlas Concordance",
            description: DESCRIPTION,
            url,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE}/concordance/{search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        },
      ],
    };
  },
  component: ConcordanceIndex,
});

function ConcordanceIndex() {
  const trending = useServerFn(concordanceTrending);
  const { data: hot = [] } = useQuery({
    queryKey: ["concordance-trending"],
    queryFn: () => trending(),
    staleTime: 1000 * 60 * 30,
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <nav className="mb-8 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Bible Atlas
        </Link>
        <span className="px-1.5 opacity-50">/</span>
        <span className="text-foreground">Concordance</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Bible concordance · King James Version
        </p>
        <h1 className="scripture mt-2 text-3xl leading-tight text-foreground sm:text-4xl">
          Bible Concordance — every word, every verse, in context
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Search a word and see where it appears across all 66 books — how the Torah uses it
          compared with the Prophets or Paul, the verses themselves with their surrounding sense,
          and a tap straight into the reader at that verse. Where a word is a person, a place or a
          journey, the maps, timelines and thematic connections come with it.
        </p>
      </header>

      <div className="mt-7">
        <ConcordanceSearch autoFocus />
      </div>

      {hot.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Flame className="h-3.5 w-3.5" aria-hidden />
            Trending searches
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {hot.map((t) => (
              <li key={t.term}>
                <Link
                  to="/concordance/$term"
                  params={{ term: termSlug(t.term) }}
                  search={{ page: 1 }}
                  className="inline-flex rounded-full border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                >
                  {t.term}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {FEATURED_GROUPS.map((group) => (
        <section key={group.label} className="mt-10">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {group.label}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">{group.blurb}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {group.terms.map((term) => (
              <li key={term}>
                <Link
                  to="/concordance/$term"
                  params={{ term: termSlug(term) }}
                  search={{ page: 1 }}
                  className="inline-flex rounded-full border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                >
                  {term}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-14 rounded-2xl border bg-card p-5">
        <h2 className="scripture text-xl text-foreground">Built into your reading</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The concordance is not a separate dictionary. Every result opens the reader at that
          verse, where people, places and objects stay live references — tap one and the contextual
          panel opens beside the text with its map, family tree, timeline and connections.
        </p>
        <Link
          to="/$book/$chapter"
          params={{ book: "genesis", chapter: "1" }}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Start reading Genesis 1
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </main>
  );
}
