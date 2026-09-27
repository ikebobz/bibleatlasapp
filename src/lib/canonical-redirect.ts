/**
 * Canonical-host redirects.
 *
 * Legacy hosts that already have links in the wild keep working: the request is
 * 301'd to the identical path, query and hash on the canonical domain, so an
 * old shared verse link still lands on the exact verse — and search engines
 * consolidate on one domain instead of indexing duplicates.
 *
 * Preview hosts, localhost and public API endpoints are deliberately excluded
 * so the editor preview, webhooks and cron keep working untouched.
 */

import { SITE_HOST, SITE_URL } from "./site";

/** Hosts whose traffic belongs on the canonical domain. */
export function isLegacyHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === SITE_HOST) return false;
  if (h === `www.${SITE_HOST}`) return true;
  if (h === "bibleatlas.lovable.app") return true;
  return (
    h.endsWith(".lovable.app") &&
    !h.startsWith("id-preview--") &&
    !h.startsWith("preview--") &&
    !h.endsWith("-dev.lovable.app")
  );
}

/** The canonical URL a request should be redirected to, or null to serve it. */
export function canonicalRedirectTarget(requestUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }
  if (url.host.toLowerCase() === SITE_HOST) return null;
  if (url.pathname.startsWith("/api/public/")) return null;
  if (!isLegacyHost(url.host)) return null;
  return new URL(url.pathname + url.search + url.hash, SITE_URL).toString();
}

export function canonicalHostRedirect(request: Request): Response | null {
  const target = canonicalRedirectTarget(request.url);
  if (!target) return null;
  return new Response(null, {
    status: 301,
    headers: { location: target, "cache-control": "public, max-age=3600" },
  });
}
