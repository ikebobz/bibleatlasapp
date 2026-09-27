import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsExplorer, parseConnectionsSearch } from "@/components/threads/ConnectionsExplorer";
import { SITE_URL as SITE } from "@/lib/site";

export const Route = createFileRoute("/connections/")({
  validateSearch: parseConnectionsSearch,
  head: () => {
    const title = "Connections — Bible Atlas";
    const description =
      "An interactive graph of the links between biblical events, people and symbols: Passover to the Last Supper, Isaac to the cross, Melchizedek to Hebrews.";
    const url = `${SITE}/connections`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: title,
            description,
            url,
          }),
        },
      ],
    };
  },
  component: ConnectionsRoute,
});

function ConnectionsRoute() {
  return <ConnectionsExplorer search={Route.useSearch()} />;
}

