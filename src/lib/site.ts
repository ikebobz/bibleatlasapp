/**
 * Single source of truth for the production base URL.
 *
 * Everything user-facing — shared verse links, canonical tags, og:url,
 * structured data, the sitemap, emails and notifications — resolves its origin
 * from here. Local development and preview deployments can point elsewhere by
 * setting `VITE_SITE_URL`; production falls back to the real domain so a link
 * shared from any host still sends the recipient to mybibleatlas.com.
 */

const FALLBACK_SITE_URL = "https://mybibleatlas.com";

function configured(): string {
  const fromVite =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.["VITE_SITE_URL"] as string | undefined)
      : undefined;
  const fromNode =
    typeof process !== "undefined" ? (process.env?.["SITE_URL"] as string | undefined) : undefined;
  const raw = (fromVite ?? fromNode ?? "").trim();
  if (!raw) return FALLBACK_SITE_URL;
  try {
    return new URL(raw).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

/** Absolute origin of the production site, e.g. "https://mybibleatlas.com". */
export const SITE_URL = configured();

/** The bare host, for redirect and display purposes ("mybibleatlas.com"). */
export const SITE_HOST = new URL(SITE_URL).host;

/** Absolute URL for a path on the canonical domain. */
export function canonicalUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}
