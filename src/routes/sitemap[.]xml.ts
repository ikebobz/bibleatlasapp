import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { XML_HEADERS, renderSitemapIndex, sitemapSections } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(renderSitemapIndex(sitemapSections()), { headers: XML_HEADERS }),
    },
  },
});
