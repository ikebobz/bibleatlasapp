import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/**
 * The build id the site is currently serving.
 *
 * Installed apps poll this to find out they are running an old bundle, even
 * when the service worker never noticed a new version. Always uncached.
 */
export const Route = createFileRoute("/api/public/build")({
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ buildId: __BUILD_ID__ }), {
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store, no-cache, must-revalidate",
          },
        }),
    },
  },
});
