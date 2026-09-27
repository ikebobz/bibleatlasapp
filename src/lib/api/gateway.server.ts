/**
 * The single outbound path to every external provider.
 *
 * Bible text, search, audio and the API.Bible catalogue all go through
 * `cachedCall`, which gives the whole app one consistent policy:
 *
 *   1. per-isolate memory cache   (free, but short-lived on Cloudflare)
 *   2. durable cache in Postgres  (shared by every isolate — the real win)
 *   3. in-flight de-duplication   (N concurrent callers → 1 upstream request)
 *   4. only then, the provider
 *
 * Every real upstream call is counted in `api_usage_daily` so monthly spend is
 * observable per provider and per feature, and every call is timed into
 * `ops_metrics` with its cache outcome.
 *
 * Cache keys are built here, never by callers, and always carry the
 * translation — `chapter:niv:john:3` can never be served to a KJV reader.
 */

import { boundedCache } from "../lru";
import { recordOps } from "../monitor.server";

export type CacheLayer = "memory" | "durable" | "miss";

type Entry<T> = { at: number; value: T; ttl?: number };

/** One shared memory tier for all features; bounded so isolates stay small. */
const memory = boundedCache<Entry<unknown>>(400);
const inflight = new Map<string, Promise<unknown>>();

/** Disabled under test so each case exercises a real upstream call. */
const enabled = process.env["NODE_ENV"] !== "test" && !process.env["VITEST"];

export function clearApiCacheMemory() {
  inflight.clear();
}

export type CachedCallOptions<T> = {
  /** Provider name for reporting: "api-bible", "bolls", "bible-api". */
  provider: string;
  /** Feature name for the budget breakdown: "chapter", "search", "audio"… */
  feature: string;
  /** Stable resource id inside the feature, e.g. "john:3" or a query. */
  resource: string;
  /** Translation id, when the resource is translation-scoped. */
  translation?: string;
  /** How long the durable cache may serve this value. */
  ttlMs: number;
  /** Optional shorter memory TTL (defaults to `ttlMs`). */
  memoryTtlMs?: number;
  /** Skip the durable tier (used for licence-sensitive or huge payloads). */
  durable?: boolean;
  /** The actual upstream call. */
  run: () => Promise<T>;
  /** Return false to avoid caching a degenerate result (e.g. empty list). */
  cacheable?: (value: T) => boolean;
  /**
   * Per-value lifetime (e.g. a signed URL's own expiry). Overrides `ttlMs`
   * when shorter, for both memory and durable tiers.
   */
  ttlFor?: (value: T) => number;
  /** Return false to reject a cached hit (e.g. an expired signed URL). */
  isFresh?: (value: T) => boolean;
  /** Skip every cache read and fetch upstream (the result is still cached). */
  bypass?: boolean;
  /**
   * Runs immediately before a real upstream call — never on a cache hit.
   * Rate limiting belongs here so cached reads are always free.
   */
  onUpstream?: () => Promise<void>;
};

export function cacheKey(o: {
  feature: string;
  translation?: string;
  resource: string;
}): string {
  return [o.feature, o.translation ?? "-", o.resource].join(":");
}

async function readDurable<T>(key: string): Promise<T | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("api_cache")
      .select("payload, expires_at")
      .eq("key", key)
      .maybeSingle();
    if (!data) return null;
    if (new Date(data.expires_at).getTime() <= Date.now()) return null;
    return (data.payload as { v: T })?.v ?? null;
  } catch {
    return null;
  }
}

async function writeDurable(
  key: string,
  o: { provider: string; feature: string; translation?: string; ttlMs: number },
  value: unknown,
): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("api_cache").upsert(
      {
        key,
        provider: o.provider,
        feature: o.feature,
        translation: o.translation ?? null,
        payload: { v: value } as unknown as Record<string, never>,
        expires_at: new Date(Date.now() + o.ttlMs).toISOString(),
      },
      { onConflict: "key" },
    );
  } catch {
    /* caching is best-effort; never fail a read because the cache is down */
  }
}

/** Count one real upstream request against the monthly budget. */
async function countUpstream(provider: string, feature: string): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("bump_api_usage", {
      _provider: provider,
      _feature: feature,
      _calls: 1,
    });
  } catch {
    /* accounting must never break a read */
  }
}

/**
 * Fetch `resource` through every cache tier, calling `run` at most once per
 * key across all concurrent callers in this isolate.
 */
export async function cachedCall<T>(options: CachedCallOptions<T>): Promise<T> {
  const {
    provider,
    feature,
    resource,
    translation,
    ttlMs,
    memoryTtlMs = ttlMs,
    durable = true,
    run,
    cacheable,
    onUpstream,
    ttlFor,
    isFresh = () => true,
    bypass = false,
  } = options;
  const key = cacheKey({ feature, translation, resource });
  const surface = `api.${feature}`;
  const startedAt = Date.now();

  if (enabled) {
    const hit = memory.get(key) as Entry<T> | undefined;
    if (!bypass && hit && Date.now() - hit.at < (hit.ttl ?? memoryTtlMs) && isFresh(hit.value)) {
      recordOps({ surface, kind: "api", outcome: "ok", cache: "hit", source: `${provider}:memory`, durationMs: Date.now() - startedAt });
      return hit.value;
    }

    const pending = inflight.get(key) as Promise<T> | undefined;
    if (pending) {
      recordOps({ surface, kind: "api", outcome: "ok", cache: "shared", source: `${provider}:inflight`, durationMs: 0 });
      return pending;
    }
  }

  const work = (async (): Promise<T> => {
    if (enabled && durable && !bypass) {
      const stored = await readDurable<T>(key);
      if (stored !== null && stored !== undefined && isFresh(stored)) {
        memory.set(key, { at: Date.now(), value: stored });
        recordOps({ surface, kind: "api", outcome: "ok", cache: "hit", source: `${provider}:durable`, durationMs: Date.now() - startedAt });
        return stored;
      }
    }

    // Only a genuine upstream call is rate limited; cached reads stay free.
    if (onUpstream) await onUpstream();

    const upstreamStart = Date.now();
    try {
      const value = await run();
      void countUpstream(provider, feature);
      recordOps({ surface, kind: "api", outcome: "ok", cache: "miss", source: provider, durationMs: Date.now() - upstreamStart });
      const worthCaching = cacheable ? cacheable(value) : true;
      const life = ttlFor ? Math.min(ttlMs, ttlFor(value)) : ttlMs;
      if (enabled && worthCaching && life > 0) {
        memory.set(key, { at: Date.now(), value, ttl: Math.min(memoryTtlMs, life) });
        if (durable) void writeDurable(key, { provider, feature, translation, ttlMs: life }, value);
      }
      return value;
    } catch (error) {
      void countUpstream(provider, feature);
      recordOps({
        surface,
        kind: "api",
        outcome: "error",
        cache: "miss",
        source: provider,
        durationMs: Date.now() - upstreamStart,
        detail: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  })();

  if (enabled) {
    inflight.set(key, work);
    void work.catch(() => undefined).finally(() => inflight.delete(key));
  }
  return work;
}

/**
 * Exponential backoff with jitter.
 *
 * Retrying instantly turns a provider hiccup into a request storm, which is
 * exactly what burns the monthly allowance.
 */
export function backoffDelay(attempt: number, baseMs = 250, capMs = 2000): number {
  const raw = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.round(raw / 2 + Math.random() * (raw / 2));
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
