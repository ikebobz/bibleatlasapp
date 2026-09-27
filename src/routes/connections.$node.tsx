import { createFileRoute, notFound } from "@tanstack/react-router";
import { ConnectionsExplorer, parseConnectionsSearch } from "@/components/threads/ConnectionsExplorer";
import { NODE_BY_ID } from "@/lib/threads/graph";
import { SITE_URL as SITE } from "@/lib/site";

export const Route = createFileRoute("/connections/$node")({
  validateSearch: parseConnectionsSearch,
  loader: ({ params }) => {
    const node = NODE_BY_ID[params.node];
    if (!node) throw notFound();
    return { node };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Connection not found — Bible Atlas" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.node.label} — connections across Scripture`;
    const description = `${loaderData.node.summary} See how ${loaderData.node.label} (${loaderData.node.ref}) links to the rest of the biblical story.`.slice(0, 158);
    const url = `${SITE}/connections/${params.node}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Article",
                headline: loaderData.node.label,
                description,
                url,
                isPartOf: {
                  "@type": "WebSite",
                  name: "Bible Atlas",
                  url: SITE,
                },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Bible Atlas",
                    item: SITE,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: "Connections",
                    item: `${SITE}/connections`,
                  },
                  { "@type": "ListItem", position: 3, name: loaderData.node.label, item: url },
                ],
              },
            ],
          }),
        },
      ],
    };
  },

  component: NodeRoute,
  errorComponent: NodeUnavailable,
  notFoundComponent: NodeNotFound,
});

function NodeUnavailable() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">
        This connection didn’t load. Try refreshing, or browse the full graph from{" "}
        <a className="underline" href="/connections">
          Connections
        </a>
        .
      </p>
    </div>
  );
}

function NodeNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="max-w-sm text-sm text-muted-foreground">
        No such connection.{" "}
        <a className="underline" href="/connections">
          Explore all threads
        </a>
        .
      </p>
    </div>
  );
}

function NodeRoute() {
  const { node } = Route.useLoaderData();
  return <ConnectionsExplorer key={node.id} focusId={node.id} search={Route.useSearch()} />;
}

