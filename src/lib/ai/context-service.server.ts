/**
 * AIContextService — the single door every shared AI answer goes through.
 *
 * Generate once, reuse many times:
 *   normalise → deterministic key → memory → shared store → coalesce → model
 *
 * Only broadly-applicable contextual content belongs here (a word in a verse, a
 * place, an artifact's purpose, a thematic connection, a pronunciation). Private
 * or personalised answers must never be written to the shared store.
 */

import { boundedCache } from "../lru";
import { aiCacheKey, PROMPT_VERSION, TRANSLATION_SENSITIVE, type AiFeature } from "./keys";

export type { AiFeature } from "./keys";

const memory = boundedCache<unknown>(800);
const inflight = new Map<string, Promise<unknown>>();
const LEASE_SECONDS = 90;
const LEASE_RENEW_MS = 25_000;
const WAIT_POLL_MS = 750;

type Report = { tokens: number };

export type SharedAiRequest<T> = {
  feature: AiFeature;
  /** Metrics surface name, e.g. "atlas.context". */
  surface: string;
  /** The thing being explained: a word, a place, an artifact + word, a node label. */
  entity: string;
  /** The passage the answer is about, when the answer is passage-specific. */
  reference?: string;
  translation?: string;
  language?: string;
  model: string;
  /** Never publish a malformed answer to every other reader. */
  validate: (value: T) => boolean;
  /** Called only on a true miss. Set `report.tokens` so savings can be measured. */
  generate: (report: Report) => Promise<T>;
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // The generated types are regenerated separately; RPC names are checked at runtime.
  return supabaseAdmin as unknown as {
    from: (t: string) => any;
    rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
  };
}

type SharedRead<T> = { payload: T | null; disabled: boolean };

async function readShared<T>(key: string): Promise<SharedRead<T>> {
  try {
    const db = await admin();
    const { data, error } = await db
      .from("atlas_context")
      .select("payload,status")
      .eq("cache_key", key)
      .maybeSingle();
    if (error) throw new Error("Shared AI cache read failed");
    if (!data) return { payload: null, disabled: false };
    if (data.status !== "active") return { payload: null, disabled: true };
    void db.rpc("touch_ai_cache", { _key: key });
    return { payload: data.payload as T, disabled: false };
  } catch (error) {
    if (error instanceof Error && error.message === "Shared AI cache read failed") throw error;
    throw new Error("Shared AI cache is unavailable", { cause: error });
  }
}

async function writeShared(
  key: string,
  req: SharedAiRequest<unknown>,
  payload: unknown,
  tokens: number,
) {
  const db = await admin();
  const { error } = await db.from("atlas_context").upsert(
    {
      cache_key: key,
      kind: req.feature,
      term: req.entity.slice(0, 200),
      reference: (req.reference ?? "").slice(0, 120),
      payload,
      model: req.model,
      prompt_version: PROMPT_VERSION[req.feature],
      translation: TRANSLATION_SENSITIVE[req.feature] ? (req.translation ?? "kjv") : null,
      language: req.language ?? "en",
      status: "active",
      tokens,
    },
    { onConflict: "cache_key" },
  );
  if (error) throw new Error("Shared AI cache write failed");
}

async function claim(key: string, owner: string): Promise<boolean> {
  const db = await admin();
  const { data, error } = await db.rpc("claim_ai_cache_key", {
    _key: key,
    _owner: owner,
    _lease_seconds: LEASE_SECONDS,
  });
  if (error || typeof data !== "boolean") throw new Error("Shared AI cache lock is unavailable");
  return data;
}

async function renew(key: string, owner: string): Promise<boolean> {
  const db = await admin();
  const { data, error } = await db.rpc("renew_ai_cache_key", {
    _key: key,
    _owner: owner,
    _lease_seconds: LEASE_SECONDS,
  });
  if (error || typeof data !== "boolean") throw new Error("Shared AI cache lease renewal failed");
  return data;
}

async function release(key: string, owner: string) {
  try {
    const db = await admin();
    await db.rpc("release_ai_cache_key", { _key: key, _owner: owner });
  } catch {
    /* the claim expires on its own */
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function startLeaseRenewal(key: string, owner: string) {
  let failure: Error | null = null;
  let activeRenewal: Promise<void> | null = null;
  const timer = setInterval(() => {
    if (activeRenewal || failure) return;
    activeRenewal = renew(key, owner)
      .then((renewed) => {
        if (!renewed) failure = new Error("Shared AI cache lease ownership was lost");
      })
      .catch((error: unknown) => {
        failure = error instanceof Error ? error : new Error("Shared AI cache lease renewal failed");
      })
      .finally(() => {
        activeRenewal = null;
      });
  }, LEASE_RENEW_MS);

  return {
    stop: async () => {
      clearInterval(timer);
      if (activeRenewal) await activeRenewal;
      if (failure) throw failure;
    },
  };
}

/**
 * Fetch a shared AI answer, generating it at most once across all readers.
 */
export async function sharedAi<T>(req: SharedAiRequest<T>): Promise<T> {
  const { measureOps, recordCacheHit } = await import("@/lib/monitor.server");
  const started = Date.now();
  const key = aiCacheKey(req);

  const hot = memory.get(key) as T | undefined;
  if (hot !== undefined) {
    recordCacheHit(req.surface, "memory", started);
    return hot;
  }

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) {
    recordCacheHit(req.surface, "memory", started);
    return pending;
  }

  const run = (async (): Promise<T> => {
    const shared = await readShared<T>(key);
    if (shared.payload !== null && req.validate(shared.payload)) {
      memory.set(key, shared.payload);
      recordCacheHit(req.surface, "shared", started);
      return shared.payload;
    }
    // An admin disabled this answer: serve a fresh one, but never re-publish it.
    let disabled = shared.disabled;

    // Another isolate may already be generating this exact answer. Wait for
    // its published result, or take over only after its lease expires.
    const owner = crypto.randomUUID();
    let won = disabled ? true : await claim(key, owner);
    while (!won && !disabled) {
      await sleep(WAIT_POLL_MS);
      const late = await readShared<T>(key);
      if (late.payload !== null && req.validate(late.payload)) {
        memory.set(key, late.payload);
        recordCacheHit(req.surface, "shared", started);
        return late.payload;
      }
      if (late.disabled) {
        disabled = true;
        break;
      }
      won = await claim(key, owner);
    }

    const lease = disabled ? null : startLeaseRenewal(key, owner);
    try {
      const report: Report = { tokens: 0 };
      const value = await measureOps(req.surface, () => req.generate(report), {
        kind: "ai",
        source: req.model,
      });
      if (!req.validate(value)) throw new Error("AI answer failed validation");
      if (!disabled) {
        // The answer already exists: cache bookkeeping must never discard it.
        let owns = true;
        try {
          await lease?.stop();
        } catch {
          owns = false; // lease lost — another isolate may publish instead.
        }
        memory.set(key, value);
        if (owns) {
          try {
            await writeShared(key, req as SharedAiRequest<unknown>, value, report.tokens);
          } catch (error) {
            console.error("[sharedAi] cache write failed", error);
          }
        }
      }
      return value;

    } finally {
      if (lease) {
        try {
          await lease.stop();
        } catch {
          // The generation path already fails before publishing when renewal fails.
        }
      }
      if (won && !disabled) await release(key, owner);
    }
  })();

  inflight.set(key, run);
  try {
    return await run;
  } finally {
    inflight.delete(key);
  }
}

/** Token usage reported by the Lovable AI Gateway, when present. */
export function tokensOf(json: unknown): number {
  const usage = (json as { usage?: { total_tokens?: number } } | null)?.usage;
  return typeof usage?.total_tokens === "number" ? usage.total_tokens : 0;
}
