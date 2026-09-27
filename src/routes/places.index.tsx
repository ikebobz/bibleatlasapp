import { createFileRoute, Link } from "@tanstack/react-router";

import { PUBLISHED_PLACES } from "@/lib/entities/registry";
import { entityHubStructuredData } from "@/lib/entities/structured-data";
import { SITE_URL as SITE } from "@/lib/site";
import type { CuratedPlace } from "@/lib/entities/copy";

const TITLE = "Places of the Bible — Maps & History | Bible Atlas";
const DESCRIPTION =
  "Jerusalem, Bethlehem, Babylon, Ephesus and more: where each biblical place stands today, what archaeology has found there, and every verse that names it.";

export const Route = createFileRoute("/places/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/places` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: `${SITE}/places` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          entityHubStructuredData({
            type: "place",
            title: "Places of the Bible",
            description: DESCRIPTION,
            items: PUBLISHED_PLACES.map((p) => ({
              name: p.name,
              url: `${SITE}/places/${p.slug}`,
            })),
          }),
        ),
      },
    ],
  }),
  component: PlacesHub,
});

function PlacesHub() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-5 sm:py-14">
      <nav className="mb-8 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">
          Bible Atlas
        </Link>
        <span className="px-1.5 opacity-50">/</span>
        <span className="text-foreground">Places</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Entity index
        </p>
        <h1 className="scripture mt-2 text-3xl leading-tight text-foreground sm:text-4xl">
          Places of the Bible
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Each place has its own page: the region it belongs to, where it stands today, what
          excavation has actually turned up, and every King James verse that names it — linked back
          into the reader and the interactive maps.
        </p>
      </header>

      <ul className="mt-8 grid gap-2 sm:mt-10 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {PUBLISHED_PLACES.map((p) => {
          const curated = p.curated as CuratedPlace | null;
          return (
            <li key={p.slug}>
              <Link
                to="/places/$slug"
                params={{ slug: p.slug }}
                search={{}}
                className="block min-h-11 rounded-lg border bg-card p-3 transition-colors hover:bg-muted sm:p-4"
              >
                <span className="scripture block text-lg text-foreground">{p.name}</span>
                {curated?.modern && (
                  <span className="mt-0.5 block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Today: {curated.modern}
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
        Looking for a person instead?{" "}
        <Link to="/people" className="underline underline-offset-4 hover:text-foreground">
          Browse people of the Bible
        </Link>
        .
      </p>
    </main>
  );
}
