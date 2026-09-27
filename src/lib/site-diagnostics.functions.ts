/**
 * Admin-only environment diagnostics: what the server actually computes for the
 * canonical domain, so production and preview behaviour can be compared at a
 * glance without reading the source.
 */

import { createServerFn } from "@tanstack/react-start";

import { SITE_HOST, SITE_URL, canonicalUrl } from "@/lib/site";
import { canonicalRedirectTarget } from "@/lib/canonical-redirect";
import { buildReaderHead } from "@/lib/reader-head";
import { verseCardUrl } from "@/lib/share";

export type RedirectCheck = { host: string; target: string | null };

export type SiteDiagnostics = {
  siteUrl: string;
  siteHost: string;
  /** Where SITE_URL came from: an explicit env override or the built-in default. */
  source: "VITE_SITE_URL" | "SITE_URL (env)" | "built-in fallback";
  configuredValue: string | null;
  requestHost: string | null;
  requestWouldRedirectTo: string | null;
  canonicalHome: string;
  verseCanonical: string;
  verseOgUrl: string;
  verseCardUrl: string;
  sitemapBase: string;
  sitemapSamples: string[];
  robotsSitemapLine: string;
  redirectChecks: RedirectCheck[];
  /** Which path produced the live verse card: "verse", "default", "static". */
  cardRender: string;
  cardContentType: string;
};

const LEGACY_HOSTS = [
  "bibleatlas.lovable.app",
  `www.${SITE_HOST}`,
  SITE_HOST,
  "id-preview--2d4512d7-3c7b-42ec-9dfb-417ab7fd82c3.lovable.app",
  "localhost:8080",
];

export const getSiteDiagnostics = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ locked: true } | ({ locked: false } & SiteDiagnostics)> => {
    const { isAdminSession } = await import("@/lib/admin/gate.server");
    if (!(await isAdminSession())) return { locked: true };
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const requestHost = (() => {
      try {
        return getRequestHeader("host") ?? null;
      } catch {
        return null;
      }
    })();

    const viteValue = (import.meta.env?.["VITE_SITE_URL"] as string | undefined)?.trim() || null;
    const nodeValue = process.env["SITE_URL"]?.trim() || null;
    const source: SiteDiagnostics["source"] = viteValue
      ? "VITE_SITE_URL"
      : nodeValue
        ? "SITE_URL (env)"
        : "built-in fallback";

    const head = buildReaderHead({
      bookId: "john",
      bookName: "John",
      chapter: 3,
      verse: 16,
      verseText: "For God so loved the world…",
      verseInPath: true,
    });
    // Ask the live card endpoint on this host which path it actually took, so
    // a silent fallback to the generic parchment image is visible here.
    const card = await (async () => {
      try {
        const origin = requestHost
          ? `${requestHost.startsWith("localhost") ? "http" : "https"}://${requestHost}`
          : SITE_URL;
        const res = await fetch(
          `${origin}/api/public/og/verse?ref=John+3%3A16&book=john&chapter=3&verse=16`,
          { method: "GET" },
        );
        return {
          render: res.headers.get("x-card-render") ?? "unknown",
          contentType: res.headers.get("content-type") ?? "unknown",
        };
      } catch (error) {
        return { render: `error: ${String(error)}`, contentType: "unknown" };
      }
    })();

    const metaOf = (key: string) =>
      (
        head.meta.find(
          (m) =>
            (m as { name?: string }).name === key || (m as { property?: string }).property === key,
        ) as { content?: string } | undefined
      )?.content ?? "";

    return {
      locked: false,
      siteUrl: SITE_URL,
      siteHost: SITE_HOST,
      source,
      configuredValue: viteValue ?? nodeValue,
      requestHost,
      requestWouldRedirectTo: requestHost
        ? canonicalRedirectTarget(`https://${requestHost}/john/3/16`)
        : null,
      canonicalHome: canonicalUrl("/"),
      verseCanonical: head.links[0]?.href ?? "",
      verseOgUrl: metaOf("og:url"),
      verseCardUrl: verseCardUrl({
        book: "john",
        chapter: 3,
        verse: 16,
        reference: "John 3:16",
      }),
      sitemapBase: SITE_URL,
      sitemapSamples: ["/", "/about", "/journeys", "/concordance", "/genesis/1"].map(
        (p) => `${SITE_URL}${p === "/" ? "/" : p}`,
      ),
      robotsSitemapLine: `Sitemap: ${SITE_URL}/sitemap.xml`,
      cardRender: card.render,
      cardContentType: card.contentType,
      redirectChecks: LEGACY_HOSTS.map((host) => ({
        host,
        target: canonicalRedirectTarget(`https://${host}/john/3/16?s=share`),
      })),
    };
  },
);
