/**
 * Rate limiting for the AI layers.
 *
 * Every AI panel (context, artifact purpose, thread insight, lexeme,
 * pronunciation) is reachable without signing in, so call volume — not input
 * size — is the real cost risk: a scripted client could drain the workspace
 * AI budget and take the feature down for everyone.
 *
 * Counting lives in Postgres (`public.consume_ai_quota`) rather than in
 * memory, because each Cloudflare isolate would otherwise keep its own
 * counter and the effective limit would scale with isolate count.
 *
 * Three ceilings apply to every call:
 *   - burst:  per visitor, per minute
 *   - daily:  per visitor, per day
 *   - global: whole app, per day (a backstop against distributed abuse)
 *
 * The limiter fails OPEN: if the database is unreachable we would rather
 * serve readers than block them, since the global cap is a backstop and AI
 * spend is separately capped in the workspace.
 */

import { createHash } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";

const BURST_LIMIT = 20; // per visitor per minute
const BURST_WINDOW = 60;
const DAILY_LIMIT = 300; // per visitor per day
const DAY_WINDOW = 60 * 60 * 24;
const GLOBAL_DAILY_LIMIT = 20_000; // whole app per day

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

/** Stable, non-reversible visitor key. We never store the raw address. */
export function visitorKey(): string {

  let raw = "unknown";
  try {
    const request = getRequest();
    const headers = request?.headers;
    const forwarded = headers?.get("x-forwarded-for") ?? "";
    raw =
      headers?.get("cf-connecting-ip") ||
      forwarded.split(",")[0]?.trim() ||
      headers?.get("x-real-ip") ||
      "unknown";
  } catch {
    /* no request context (build-time call): fall back to the shared bucket */
  }
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/**
 * Per-isolate backstop used only when the database counter is unreachable.
 * It cannot be exact (each isolate counts on its own), so it applies a
 * deliberately loose share of the ceiling — enough to stop a runaway client
 * from making the limits meaningless while the database is unavailable.
 */
const memoryCounters = new Map<string, { windowStart: number; count: number }>();
const MEMORY_SHARE = 0.5;

function consumeInMemory(bucket: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
  const entry = memoryCounters.get(bucket);
  const next =
    entry && entry.windowStart === windowStart
      ? { windowStart, count: entry.count + 1 }
      : { windowStart, count: 1 };
  memoryCounters.set(bucket, next);

  if (memoryCounters.size > 5_000) {
    for (const [key, value] of memoryCounters) {
      if (value.windowStart !== windowStart) memoryCounters.delete(key);
    }
  }

  return next.count <= Math.max(1, Math.floor(limit * MEMORY_SHARE));
}

export async function consumeQuota(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("consume_ai_quota", {
      _bucket: bucket,
      _limit: limit,
      _window_seconds: windowSeconds,
    });
    if (error) {
      console.error("Rate limit check failed", { code: error.code });
      // Degrade to the in-process backstop instead of removing the ceiling.
      return consumeInMemory(bucket, limit, windowSeconds);
    }
    return data !== false;
  } catch (err) {
    console.error("Rate limit check threw", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return consumeInMemory(bucket, limit, windowSeconds);
  }
}

/**
 * Throws when the caller has exhausted a quota. `feature` only separates
 * counters for observability — all AI features share the same ceilings.
 */
export async function enforceAiQuota(feature: string): Promise<void> {
  const visitor = visitorKey();
  const day = new Date().toISOString().slice(0, 10);

  const [burstOk, dailyOk, globalOk] = await Promise.all([
    consumeQuota(`v:${visitor}:${feature}`, BURST_LIMIT, BURST_WINDOW),
    consumeQuota(`v:${visitor}:day`, DAILY_LIMIT, DAY_WINDOW),
    consumeQuota(`global:${day}`, GLOBAL_DAILY_LIMIT, DAY_WINDOW),
  ]);

  const denied = !burstOk ? "burst" : !dailyOk ? "visitor-daily" : !globalOk ? "global-daily" : null;
  if (denied) {
    const { recordOps } = await import("./monitor.server");
    recordOps({
      surface: `quota.${feature}`,
      kind: "quota",
      outcome: "rate_limited",
      source: denied,
      detail: `${denied} ceiling reached`,
    });
  }

  if (!burstOk) {
    throw new RateLimitError("You're looking things up very quickly — try again in a minute.");
  }
  if (!dailyOk) {
    throw new RateLimitError("You've reached today's limit for AI lookups. It resets tomorrow.");
  }
  if (!globalOk) {
    throw new RateLimitError("AI insights are resting for today — everything else still works.");
  }
}

/** Ceilings the dashboard displays alongside live usage. */
export const AI_QUOTA_LIMITS = {
  burst: BURST_LIMIT,
  visitorDaily: DAILY_LIMIT,
  globalDaily: GLOBAL_DAILY_LIMIT,
};

/**
 * Read-side ceilings (chapters, search, audio).
 *
 * These are deliberately generous — a devoted reader will never see them —
 * but they stop a runaway component, a refresh loop or a scraper from
 * draining the monthly external API allowance.
 */
const READ_BURST_LIMIT = 90; // per visitor per minute
const READ_DAILY_LIMIT = 3_000; // per visitor per day
const READ_GLOBAL_DAILY_LIMIT = 120_000; // whole app per day

export const READ_QUOTA_LIMITS = {
  burst: READ_BURST_LIMIT,
  visitorDaily: READ_DAILY_LIMIT,
  globalDaily: READ_GLOBAL_DAILY_LIMIT,
};

/**
 * Throttle a Scripture read path. Never blocks the *first* copy of anything a
 * normal reader does; callers should fall back to cached text when it throws.
 */
export async function enforceReadQuota(feature: string): Promise<void> {
  const visitor = visitorKey();
  const day = new Date().toISOString().slice(0, 10);

  const [burstOk, dailyOk, globalOk] = await Promise.all([
    consumeQuota(`r:${visitor}:${feature}`, READ_BURST_LIMIT, BURST_WINDOW),
    consumeQuota(`r:${visitor}:day`, READ_DAILY_LIMIT, DAY_WINDOW),
    consumeQuota(`read-global:${day}`, READ_GLOBAL_DAILY_LIMIT, DAY_WINDOW),
  ]);

  const denied = !burstOk ? "burst" : !dailyOk ? "visitor-daily" : !globalOk ? "global-daily" : null;
  if (!denied) return;

  const { recordOps } = await import("./monitor.server");
  recordOps({
    surface: `quota.read.${feature}`,
    kind: "quota",
    outcome: "rate_limited",
    source: denied,
    detail: `${denied} ceiling reached`,
  });
  throw new RateLimitError("You're reading very quickly — give it a moment and try again.");
}

