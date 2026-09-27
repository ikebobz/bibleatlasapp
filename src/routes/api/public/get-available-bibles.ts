import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

/**
 * The bibles our API.Bible key is actually authorised for.
 *
 * The catalogue changes rarely and the key has a hard rate limit, so the
 * response is memoised for 24h inside the isolate AND cached for 24h at the
 * CDN/browser. A dev-time render loop can therefore never drain the quota.
 */

const TTL_MS = 24 * 60 * 60 * 1000;

export type CatalogueBible = {
  id: string;
  label: string;
  name: string;
  language: string;
  apiBibleId: string;
  copyright?: string;
};

let memo: { at: number; bibles: CatalogueBible[] } | null = null;

/** Texts we already ship from public-domain sources — don't list them twice. */
const ALREADY_LOCAL = new Set([
  "de4e12af7f28f599-01",
  "de4e12af7f28f599-02",
  "9879dbb7cfe39e4d-01",
  "9879dbb7cfe39e4d-02",
  "9879dbb7cfe39e4d-03",
  "9879dbb7cfe39e4d-04",
  "06125adad2d5898a-01",
  "179568874c45066f-01",
  "78a9f6124f344018-01",
  "6f11a7de016f942e-01",
  "b8d1feac6e94bd74-01",
  "a36fc06b086699f1-02",
  // Berean Standard Bible — already a built-in entry.
  "317e03834065a236-01",
  "bba9f40183526463-01",
]);

/**
 * Near-identical editions of texts we already list. API.Bible ships several
 * regional or deuterocanonical variants of the same translation; keeping one
 * of each is what makes the picker readable.
 */
const REDUNDANT_EDITIONS = new Set([
  // World English Bible family (British, updated, Strong's-free, Messianic).
  "7142879509583d59-01",
  "7142879509583d59-02",
  "7142879509583d59-03",
  "7142879509583d59-04",
  "72f4e6dc683324df-01",
  "72f4e6dc683324df-02",
  "72f4e6dc683324df-03",
  "32664dc3288a28df-01",
  "32664dc3288a28df-02",
  "32664dc3288a28df-03",
  "f72b840c855f362c-04",
  "04da588535d2f823-04",
  // New Living Translation — keep the primary edition only.
  "b907c8622b59a1f7-01",
  "43e315b442a7c862-01",
  // Good News Translation — keep the primary edition only.
  "61fd76eafa1577c2-02",
  "61fd76eafa1577c2-03",
  // Contemporary English Version — keep the primary edition only.
  "555fef9a6cb31151-02",
  "555fef9a6cb31151-03",
]);


type ApiBibleRow = {
  id?: string;
  abbreviation?: string;
  abbreviationLocal?: string;
  name?: string;
  nameLocal?: string;
  copyright?: string;
  language?: { name?: string; nameLocal?: string };
};

function mapRows(rows: ApiBibleRow[]): CatalogueBible[] {
  const out: CatalogueBible[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const id = row.id;
    if (!id || ALREADY_LOCAL.has(id) || REDUNDANT_EDITIONS.has(id)) continue;
    const language = row.language?.name?.trim();

    const name = (row.nameLocal || row.name || "").trim();
    const label = (row.abbreviationLocal || row.abbreviation || "").trim();
    if (!language || !name || !label) continue;
    // API.Bible ships several near-identical editions of the same text; one
    // per abbreviation+language keeps the picker readable.
    const dedupe = `${language}::${label}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push({
      id: `apibible:${id}`,
      label: label.slice(0, 12),
      name,
      language,
      apiBibleId: id,
      ...(row.copyright ? { copyright: row.copyright.trim() } : {}),
    });
  }
  out.sort((a, b) => a.language.localeCompare(b.language) || a.name.localeCompare(b.name));
  return out;
}

export const Route = createFileRoute("/api/public/get-available-bibles")({
  server: {
    handlers: {
      GET: async () => {
        if (memo && Date.now() - memo.at < TTL_MS) {
          return Response.json(
            { bibles: memo.bibles, cached: true },
            {
              headers: {
                "cache-control":
                  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
              },
            },
          );
        }

        const apiKey = process.env["API_BIBLE_KEY"];
        if (!apiKey) {
          return Response.json(
            { bibles: [], error: "not-configured" },
            { headers: { "cache-control": "public, max-age=300" } },
          );
        }

        try {
          // Shared gateway: durable 24h cache + cross-isolate de-duplication,
          // so a cold isolate does not re-download the catalogue.
          const { cachedCall } = await import("@/lib/api/gateway.server");
          const bibles = await cachedCall<CatalogueBible[]>({
            provider: "api-bible",
            feature: "catalogue",
            resource: "bibles-v2",
            ttlMs: TTL_MS,
            cacheable: (rows) => rows.length > 0,
            run: async () => {
              const res = await fetch("https://api.scripture.api.bible/v1/bibles", {
                headers: { "api-key": apiKey, accept: "application/json" },
                signal: AbortSignal.timeout(8000),
              });
              if (!res.ok) throw new Error(`API.Bible responded ${res.status}`);
              const json = (await res.json()) as { data?: ApiBibleRow[] };
              return mapRows(Array.isArray(json.data) ? json.data : []);
            },
          });
          memo = { at: Date.now(), bibles };
          return Response.json(
            { bibles, cached: false },
            {
              headers: {
                "cache-control":
                  "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
              },
            },
          );
        } catch (error) {
          // Never 5xx: the picker falls back to the built-in translations.
          return Response.json(
            { bibles: [], error: error instanceof Error ? error.message : "unavailable" },
            { headers: { "cache-control": "public, max-age=300" } },
          );
        }
      },
    },
  },
});
