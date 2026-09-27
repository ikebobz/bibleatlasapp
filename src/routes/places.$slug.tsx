import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

import { EntityDetail } from "@/components/entities/EntityDetail";
import { entityBySlug, provisionalEntity } from "@/lib/entities/registry";
import { entityOccurrences } from "@/lib/entities/occurrences.functions";
import { entityStructuredData } from "@/lib/entities/structured-data";
import { SITE_URL as SITE } from "@/lib/site";

// Optional rather than defaulted, so `/people/abraham` stays canonical instead
// of redirecting to `?page=1`.
const searchSchema = z.object({
  page: z.number().int().min(1).max(200).optional().catch(undefined),
});

export const Route = createFileRoute("/places/$slug")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: async ({ params, deps }) => {
    // Names outside the reader's gazetteer have no page: a real 404.
    const entity = entityBySlug("place", params.slug);
    if (!entity) throw notFound();
    try {
      const data = await entityOccurrences({
        data: { query: entity.search, page: deps.page },
      });
      return { slug: entity.slug, page: deps.page, data };
    } catch {
      return { slug: entity.slug, page: deps.page, data: null };
    }
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found — Bible Atlas" }, { name: "robots", content: "noindex" }] };
    }
    const entity = entityBySlug("place", params.slug) ?? provisionalEntity("place", params.slug);
    const title = `${entity.name} in the Bible — Map, History & Verses | Bible Atlas`;
    const description =
      entity.curated?.summary?.slice(0, 155) ??
      `Where ${entity.name} sits on the biblical map, what happened there, and every King James verse that names it.`;
    const url = `${SITE}/places/${entity.slug}`;
    const citations = (loaderData?.data?.hits ?? []).slice(0, 8).map((h) => ({
      reference: h.reference,
      url: `${SITE}/${h.book}/${h.chapter}/${h.verse}`,
    }));
    return {
      meta: [
        { title: title.slice(0, 70) },
        { name: "description", content: description.slice(0, 158) },
        { property: "og:title", content: title.slice(0, 70) },
        { property: "og:description", content: description.slice(0, 158) },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title.slice(0, 70) },
        { name: "twitter:description", content: description.slice(0, 158) },
        ...(entity.published ? [] : [{ name: "robots", content: "noindex, follow" }]),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            entityStructuredData({ entity, title, description, citations }),
          ),
        },
      ],
    };
  },
  notFoundComponent: EntityNotFound,
  component: PlacePage,
});

function PlacePage() {
  const { slug } = Route.useParams();
  const { page, data } = Route.useLoaderData();
  const entity = entityBySlug("place", slug) ?? provisionalEntity("place", slug);
  return <EntityDetail entity={entity} data={data} page={page} />;
}

function EntityNotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="scripture text-2xl text-foreground">We couldn’t find that name</h1>
        <p className="mt-3 text-sm text-muted-foreground">It isn’t in the Bible Atlas index.</p>
        <Link
          to="/places"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm text-foreground hover:bg-muted"
        >
          Browse all
        </Link>
      </div>
    </main>
  );
}
