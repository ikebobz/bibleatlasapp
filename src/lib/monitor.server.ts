/**
 * End-to-end operational telemetry for the server layers.
 *
 * Every AI call, Scripture fetch and rate-limit decision records one row in
 * `public.ops_metrics`: how long it took, whether it succeeded, and whether it
 * was answered from cache. The admin dashboard aggregates those rows into
 * latency percentiles, error rates, cache hit rates and quota usage.
 *
 * Two rules keep this safe on Cloudflare Workers:
 *   - Writes are buffered and flushed in batches, so a hot path (chapter
 *     loads) does not pay a database round trip per request.
 *   - Recording NEVER throws and never blocks the response: monitoring must
 *     not be able to take down the thing it is monitoring.
 */

export type OpsOutcome = "ok" | "error" | "rate_limited";
export type OpsCache = "hit" | "miss" | "shared" | null;

export type OpsEvent = {
  surface: string;
  kind?: "ai" | "api" | "quota";
  outcome: OpsOutcome;
  cache?: OpsCache;
  source?: string | null;
  durationMs?: number;
  detail?: string | null;
};

const BUFFER_LIMIT = 12;
const FLUSH_AFTER_MS = 5_000;

let buffer: OpsEvent[] = [];
let lastFlush = Date.now();
let flushing: Promise<void> | null = null;

function toRow(event: OpsEvent) {
  return {
    surface: event.surface.slice(0, 60),
    kind: event.kind ?? "ai",
    outcome: event.outcome,
    cache: event.cache ?? null,
    source: event.source ? event.source.slice(0, 60) : null,
    duration_ms: Math.max(0, Math.round(event.durationMs ?? 0)),
    detail: event.detail ? event.detail.slice(0, 300) : null,
  };
}

async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const rows = buffer.map(toRow);
  buffer = [];
  lastFlush = Date.now();
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("ops_metrics").insert(rows);
    if (error) console.error("Ops metrics write failed", { code: error.code });
  } catch (error) {
    // Telemetry is best-effort; losing a batch is preferable to failing a read.
    console.error("Ops metrics write threw", { message: String(error).slice(0, 200) });
  }
}

/** Buffered, fire-and-forget. Safe to call from any server path. */
export function recordOps(event: OpsEvent): void {
  buffer.push(event);
  // AI events are low-volume and their request often ends before the buffer
  // fills, so flush them straight away instead of losing them with the isolate.
  const urgent = event.kind === "ai" || event.kind === undefined;
  const due = urgent || buffer.length >= BUFFER_LIMIT || Date.now() - lastFlush > FLUSH_AFTER_MS;
  if (!due || flushing) return;
  flushing = flush().finally(() => {
    flushing = null;
  });
}

/** Force a flush (used by the admin dashboard so numbers are current). */
export async function flushOps(): Promise<void> {
  if (flushing) await flushing;
  await flush();
}

/**
 * Time an operation and record its outcome.
 *
 * `cache` describes how the value was obtained; pass "hit" from a cached
 * branch so the dashboard can compute a real hit rate.
 */
export async function measureOps<T>(
  surface: string,
  run: () => Promise<T>,
  options: { kind?: OpsEvent["kind"]; source?: string } = {},
): Promise<T> {
  const started = Date.now();
  try {
    const value = await run();
    recordOps({
      surface,
      kind: options.kind,
      outcome: "ok",
      cache: "miss",
      source: options.source ?? null,
      durationMs: Date.now() - started,
    });
    return value;
  } catch (error) {
    const rateLimited =
      error instanceof Error && (error.name === "RateLimitError" || /429/.test(error.message));
    recordOps({
      surface,
      kind: options.kind,
      outcome: rateLimited ? "rate_limited" : "error",
      cache: "miss",
      source: options.source ?? null,
      durationMs: Date.now() - started,
      detail: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/** Record a cache hit (near-zero latency, no upstream call). */
export function recordCacheHit(surface: string, source: string, startedAt: number): void {
  recordOps({
    surface,
    outcome: "ok",
    cache: "hit",
    source,
    durationMs: Date.now() - startedAt,
  });
}
