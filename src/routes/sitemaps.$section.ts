import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { XML_HEADERS, entriesForSection, renderUrlset } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemaps/$section")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        // The whole segment (e.g. "chapters-1.xml") arrives as the param.
        const section = params.section.replace(/\.xml$/, "");
        const entries = entriesForSection(section);
        if (!entries) return new Response("Not found", { status: 404 });
        return new Response(renderUrlset(entries), { headers: XML_HEADERS });
      },
    },
  },
});
