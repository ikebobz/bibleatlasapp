import { createFileRoute, Link } from "@tanstack/react-router";

import { PUBLISHED_PEOPLE } from "@/lib/entities/registry";
import { entityHubStructuredData } from "@/lib/entities/structured-data";
import { SITE_URL as SITE } from "@/lib/site";
import type { CuratedPerson } from "@/lib/entities/copy";

const TITLE = "People of the Bible — Who They Were | Bible Atlas";
const DESCRIPTION =
  "Abraham, Moses, David, Mary, Paul and dozens more: who each person is in Scripture, every verse where the name appears, and the maps and timelines behind them.";

export const Route = createFileRoute("/people/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/people` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: `${SITE}/people` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          entityHubStructuredData({
            type: "person",
            title: "People of the Bible",
            description: DESCRIPTION,
            items: PUBLISHED_PEOPLE.map((p) => ({
              name: p.name,
              url: `${SITE}/people/${p.slug}`,
            })),
          }),
        ),
      },
    ],
  }),
  component: PeopleHub,
});

function PeopleHub() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-14">
      <nav className="mb-8 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">
          Bible Atlas
        </Link>
        <span className="px-1.5 opacity-50">/</span>
        <span className="text-foreground">People</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Entity index
        </p>
        <h1 className="scripture mt-2 text-3xl leading-tight text-foreground sm:text-4xl">
          People of the Bible
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Every person here has a page with their place in the story, the verses that name them,
          and the journeys, moments and threads they belong to. Names highlighted while you read
          link straight through to these pages.
        </p>
      </header>

      <ul className="mt-8 grid gap-2 sm:mt-10 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {PUBLISHED_PEOPLE.map((p) => {
          const curated = p.curated as CuratedPerson | null;
          return (
            <li key={p.slug}>
              <Link
                to="/people/$slug"
                params={{ slug: p.slug }}
                search={{}}
                className="block min-h-11 rounded-lg border bg-card p-3 transition-colors hover:bg-muted sm:p-4"
              >
                <span className="scripture block text-lg text-foreground">{p.name}</span>
                {curated?.role && (
                  <span className="mt-0.5 block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    {curated.role}
                  </span>
                )}
                <span className="mt-1.5 block line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:line-clamp-3">
                  {curated?.summary}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-10 text-sm text-muted-foreground">
        Looking for a location instead?{" "}
        <Link to="/places" className="underline underline-offset-4 hover:text-foreground">
          Browse places of the Bible
        </Link>
        .
      </p>
    </main>
  );
}
