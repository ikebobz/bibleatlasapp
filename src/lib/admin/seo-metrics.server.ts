/**
 * Semrush-backed link metrics for the internal SEO dashboard.
 *
 * Calls go through the Lovable connector gateway (never the Semrush API
 * directly) and every successful fetch is written to
 * `seo_backlink_snapshots` as one row per UTC day, which is what gives the
 * dashboard its "over time" view.
 */

const GATEWAY = "https://connector-gateway.lovable.dev/semrush";

export type BacklinkOverview = {
  authorityScore: number | null;
  referringDomains: number | null;
  backlinksTotal: number | null;
  referringIps: number | null;
  follows: number | null;
  nofollows: number | null;
  texts: number | null;
  images: number | null;
};

export type RefDomain = { domain: string; authorityScore: number | null; backlinks: number | null };
export type Anchor = { anchor: string; domains: number | null; backlinks: number | null };

export type SeoSnapshot = BacklinkOverview & {
  capturedOn: string;
  topDomains: RefDomain[];
  topAnchors: Anchor[];
};

export class SemrushError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

type SemrushPayload = { data?: { columnNames?: string[]; rows?: unknown[] } };

/** Semrush rows come back either as arrays or as objects keyed by column name. */
function toRecords(payload: SemrushPayload): Record<string, string>[] {
  const columns = payload.data?.columnNames ?? [];
  const rows = payload.data?.rows ?? [];
  return rows.map((row) => {
    if (Array.isArray(row)) {
      const record: Record<string, string> = {};
      columns.forEach((col, i) => {
        record[col] = String(row[i] ?? "");
      });
      return record;
    }
    const record: Record<string, string> = {};
    for (const [key, value] of Object.entries((row ?? {}) as Record<string, unknown>)) {
      record[key] = String(value ?? "");
    }
    return record;
  });
}

function pick(record: Record<string, string>, ...keys: string[]): string | null {
  const lowered = new Map(Object.entries(record).map(([k, v]) => [k.toLowerCase(), v]));
  for (const key of keys) {
    const value = lowered.get(key.toLowerCase());
    if (value !== undefined && value !== "") return value;
  }
  return null;
}

function num(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function semrush(path: string, params: Record<string, string>): Promise<SemrushPayload> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["SEMRUSH_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new SemrushError("Semrush is not connected for this project.", 503);
  }

  const url = `${GATEWAY}${path}?${new URLSearchParams(params).toString()}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
      "Allow-Limit-Offset": "true",
    },
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(`Semrush request failed [${response.status}]: ${body}`);
    if (body.includes("LIMIT EXCEEDED")) {
      throw new SemrushError(
        "The Semrush API quota is exhausted — upgrade your Semrush plan or wait for the quota to reset.",
        429,
      );
    }
    throw new SemrushError(`Semrush request failed [${response.status}]: ${body}`, response.status);
  }

  try {
    return JSON.parse(body) as SemrushPayload;
  } catch {
    throw new SemrushError("Semrush returned an unreadable response.", 502);
  }
}

/** Fetch a fresh overview + top referring domains + top anchors for a target. */
export async function fetchSeoSnapshot(target: string): Promise<SeoSnapshot> {
  const base = { target, target_type: "root_domain" };

  const [overviewRaw, domainsRaw, anchorsRaw] = await Promise.all([
    semrush("/backlinks/backlinks_overview", {
      ...base,
      export_columns: "ascore,total,domains_num,urls_num,ips_num,follows_num,nofollows_num,texts_num,images_num",
    }),
    semrush("/backlinks/backlinks_refdomains", {
      ...base,
      export_columns: "domain_ascore,domain,backlinks_num",
      display_limit: "10",
    }),
    semrush("/backlinks/backlinks_anchors", {
      ...base,
      export_columns: "anchor,domains_num,backlinks_num",
      display_limit: "10",
    }),
  ]);

  const overviewRow = toRecords(overviewRaw)[0] ?? {};

  const topDomains: RefDomain[] = toRecords(domainsRaw).map((row) => ({
    domain: pick(row, "domain") ?? "—",
    authorityScore: num(pick(row, "domain_ascore", "domain ascore", "ascore")),
    backlinks: num(pick(row, "backlinks_num", "backlinks num", "backlinks")),
  }));

  const topAnchors: Anchor[] = toRecords(anchorsRaw).map((row) => ({
    anchor: pick(row, "anchor") ?? "—",
    domains: num(pick(row, "domains_num", "domains num", "domains")),
    backlinks: num(pick(row, "backlinks_num", "backlinks num", "backlinks")),
  }));

  return {
    capturedOn: new Date().toISOString().slice(0, 10),
    authorityScore: num(pick(overviewRow, "ascore", "authority score")),
    referringDomains: num(pick(overviewRow, "domains_num", "domains num", "referring domains")),
    backlinksTotal: num(pick(overviewRow, "total", "backlinks")),
    referringIps: num(pick(overviewRow, "ips_num", "ips num", "referring ips")),
    follows: num(pick(overviewRow, "follows_num", "follows num", "follows")),
    nofollows: num(pick(overviewRow, "nofollows_num", "nofollows num", "nofollows")),
    texts: num(pick(overviewRow, "texts_num", "texts num", "texts")),
    images: num(pick(overviewRow, "images_num", "images num", "images")),
    topDomains,
    topAnchors,
  };
}

type SnapshotRow = {
  captured_on: string;
  authority_score: number | null;
  referring_domains: number | null;
  backlinks_total: number | null;
  referring_ips: number | null;
  follows: number | null;
  nofollows: number | null;
  texts: number | null;
  images: number | null;
  top_domains: RefDomain[] | null;
  top_anchors: Anchor[] | null;
};

function fromRow(row: SnapshotRow): SeoSnapshot {
  return {
    capturedOn: row.captured_on,
    authorityScore: row.authority_score,
    referringDomains: row.referring_domains,
    backlinksTotal: row.backlinks_total,
    referringIps: row.referring_ips,
    follows: row.follows,
    nofollows: row.nofollows,
    texts: row.texts,
    images: row.images,
    topDomains: row.top_domains ?? [],
    topAnchors: row.top_anchors ?? [],
  };
}

/** Persist today's snapshot (one row per target per UTC day). */
export async function saveSnapshot(target: string, snapshot: SeoSnapshot): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("seo_backlink_snapshots").upsert(
    {
      target,
      captured_on: snapshot.capturedOn,
      authority_score: snapshot.authorityScore,
      referring_domains: snapshot.referringDomains,
      backlinks_total: snapshot.backlinksTotal,
      referring_ips: snapshot.referringIps,
      follows: snapshot.follows,
      nofollows: snapshot.nofollows,
      texts: snapshot.texts,
      images: snapshot.images,
      top_domains: snapshot.topDomains,
      top_anchors: snapshot.topAnchors,
    },
    { onConflict: "target,captured_on" },
  );
  if (error) console.error("Saving SEO snapshot failed", { code: error.code });
}

/** Read stored history, oldest first. */
export async function readHistory(target: string, days: number): Promise<SeoSnapshot[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("seo_backlink_snapshots")
    .select("*")
    .eq("target", target)
    .gte("captured_on", since)
    .order("captured_on", { ascending: true })
    .limit(400);

  if (error) {
    console.error("Reading SEO snapshots failed", { code: error.code });
    return [];
  }
  return ((data ?? []) as unknown as SnapshotRow[]).map(fromRow);
}
