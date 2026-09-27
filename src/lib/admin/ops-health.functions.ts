/**
 * Operational health for the internal admin page: AI/API latency, error rates,
 * cache hit rates and AI quota usage, plus threshold-based alerts.
 *
 * Aggregation happens in Postgres (`ops_metrics_summary` / `ops_metrics_series`)
 * so the worker never pulls raw telemetry rows across the wire.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";


export type SurfaceHealth = {
  surface: string;
  kind: string;
  total: number;
  errors: number;
  rateLimited: number;
  errorRate: number;
  cacheHitRate: number | null;
  p50: number;
  p95: number;
  maxMs: number;
};

export type HealthPoint = {
  bucket: string;
  total: number;
  errors: number;
  cacheHits: number;
  p95: number;
};

export type QuotaUsage = {
  globalUsed: number;
  globalLimit: number;
  globalPct: number;
  visitorsToday: number;
  busiestVisitor: number;
  visitorDailyLimit: number;
};

/** Monthly external-API spend against the plan ceiling. */
export type ApiBudget = {
  month: string;
  monthlyLimit: number;
  used: number;
  pct: number;
  projected: number;
  today: number;
  byFeature: { feature: string; provider: string; calls: number }[];
};

export type HealthAlert = {
  level: "critical" | "warning";
  title: string;
  detail: string;
};

export type OpsHealth = {
  windowHours: number;
  totals: { calls: number; errors: number; rateLimited: number; errorRate: number };
  surfaces: SurfaceHealth[];
  series: HealthPoint[];
  quota: QuotaUsage;
  budget: ApiBudget;
  alerts: HealthAlert[];
};

export type OpsHealthResult = { locked: true } | { locked: false; health: OpsHealth };

// Alert thresholds. Deliberately conservative: an alert should mean "look now".
const ERROR_RATE_CRITICAL = 0.15;
const ERROR_RATE_WARNING = 0.05;
const P95_WARNING_MS = 8000;
const P95_CRITICAL_MS = 15000;
const CACHE_HIT_WARNING = 0.2;
const QUOTA_WARNING_PCT = 0.7;
const QUOTA_CRITICAL_PCT = 0.9;
const MIN_SAMPLE = 20; // don't alert on noise
/** The plan ceiling we must stay under, treated as a hard constraint. */
const MONTHLY_API_LIMIT = 150_000;
const BUDGET_WARNING_PCT = 0.6;
const BUDGET_CRITICAL_PCT = 0.85;

export const getOpsHealth = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ hours: z.number().int().min(1).max(168).default(24) }).parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<OpsHealthResult> => {
    const { isAdminSession } = await import("@/lib/admin/gate.server");
    if (!(await isAdminSession())) return { locked: true };
    const { flushOps } = await import("@/lib/monitor.server");

    const { AI_QUOTA_LIMITS } = await import("@/lib/ratelimit.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Make sure anything buffered in this isolate is visible in the numbers.
    await flushOps();

    const since = new Date(Date.now() - data.hours * 3600_000).toISOString();
    const day = new Date().toISOString().slice(0, 10);

    const monthStart = `${day.slice(0, 7)}-01`;

    const [summaryRes, seriesRes, quotaRes, usageRes] = await Promise.all([
      supabaseAdmin.rpc("ops_metrics_summary", { _since: since }),
      supabaseAdmin.rpc("ops_metrics_series", { _since: since }),
      supabaseAdmin
        .from("ai_rate_limit")
        .select("bucket, count")
        .gte("window_start", new Date(Date.now() - 86_400_000).toISOString())
        .limit(5000),
      supabaseAdmin
        .from("api_usage_daily")
        .select("day, provider, feature, calls")
        .gte("day", monthStart)
        .limit(2000),
    ]);

    if (summaryRes.error) console.error("Ops summary failed", { code: summaryRes.error.code });
    if (seriesRes.error) console.error("Ops series failed", { code: seriesRes.error.code });
    if (quotaRes.error) console.error("Quota read failed", { code: quotaRes.error.code });
    if (usageRes.error) console.error("API usage read failed", { code: usageRes.error.code });

    type SummaryRow = {
      surface: string;
      kind: string;
      total: number;
      errors: number;
      rate_limited: number;
      cache_hits: number;
      cache_eligible: number;
      p50: number;
      p95: number;
      max_ms: number;
    };
    type SeriesRow = {
      bucket: string;
      total: number;
      errors: number;
      cache_hits: number;
      p95: number;
    };

    const surfaces: SurfaceHealth[] = ((summaryRes.data ?? []) as SummaryRow[]).map((row) => ({
      surface: row.surface,
      kind: row.kind,
      total: Number(row.total),
      errors: Number(row.errors),
      rateLimited: Number(row.rate_limited),
      errorRate: Number(row.total) ? Number(row.errors) / Number(row.total) : 0,
      cacheHitRate: Number(row.cache_eligible)
        ? Number(row.cache_hits) / Number(row.cache_eligible)
        : null,
      p50: Number(row.p50),
      p95: Number(row.p95),
      maxMs: Number(row.max_ms),
    }));

    const series: HealthPoint[] = ((seriesRes.data ?? []) as SeriesRow[]).map((row) => ({
      bucket: row.bucket,
      total: Number(row.total),
      errors: Number(row.errors),
      cacheHits: Number(row.cache_hits),
      p95: Number(row.p95),
    }));

    const calls = surfaces.reduce((sum, s) => sum + s.total, 0);
    const errors = surfaces.reduce((sum, s) => sum + s.errors, 0);
    const rateLimited = surfaces.reduce((sum, s) => sum + s.rateLimited, 0);

    const quotaRows = (quotaRes.data ?? []) as { bucket: string; count: number }[];
    const globalUsed = quotaRows
      .filter((r) => r.bucket === `global:${day}`)
      .reduce((sum, r) => sum + Number(r.count), 0);
    const visitorDayRows = quotaRows.filter((r) => r.bucket.endsWith(":day"));
    const quota: QuotaUsage = {
      globalUsed,
      globalLimit: AI_QUOTA_LIMITS.globalDaily,
      globalPct: globalUsed / AI_QUOTA_LIMITS.globalDaily,
      visitorsToday: visitorDayRows.length,
      busiestVisitor: visitorDayRows.reduce((max, r) => Math.max(max, Number(r.count)), 0),
      visitorDailyLimit: AI_QUOTA_LIMITS.visitorDaily,
    };

    // Monthly external-API spend. Only real upstream calls are counted here,
    // so this is the number that must stay under the plan ceiling.
    const usageRows = (usageRes.data ?? []) as {
      day: string;
      provider: string;
      feature: string;
      calls: number;
    }[];
    const used = usageRows.reduce((sum, r) => sum + Number(r.calls), 0);
    const today = usageRows
      .filter((r) => r.day === day)
      .reduce((sum, r) => sum + Number(r.calls), 0);
    const byFeatureMap = new Map<string, { feature: string; provider: string; calls: number }>();
    for (const row of usageRows) {
      const key = `${row.provider}:${row.feature}`;
      const entry = byFeatureMap.get(key) ?? {
        feature: row.feature,
        provider: row.provider,
        calls: 0,
      };
      entry.calls += Number(row.calls);
      byFeatureMap.set(key, entry);
    }
    const now = new Date();
    const dayOfMonth = now.getUTCDate();
    const daysInMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const budget: ApiBudget = {
      month: day.slice(0, 7),
      monthlyLimit: MONTHLY_API_LIMIT,
      used,
      pct: used / MONTHLY_API_LIMIT,
      // Straight-line run rate: what this month lands on if nothing changes.
      projected: Math.round((used / dayOfMonth) * daysInMonth),
      today,
      byFeature: [...byFeatureMap.values()].sort((a, b) => b.calls - a.calls).slice(0, 8),
    };

    const alerts: HealthAlert[] = [];
    const pct = (n: number) => `${Math.round(n * 100)}%`;

    for (const s of surfaces) {
      if (s.total >= MIN_SAMPLE && s.errorRate >= ERROR_RATE_WARNING) {
        alerts.push({
          level: s.errorRate >= ERROR_RATE_CRITICAL ? "critical" : "warning",
          title: `${s.surface} is failing`,
          detail: `${pct(s.errorRate)} of ${s.total} calls errored in the last ${data.hours}h.`,
        });
      }
      if (s.total >= MIN_SAMPLE && s.p95 >= P95_WARNING_MS) {
        alerts.push({
          level: s.p95 >= P95_CRITICAL_MS ? "critical" : "warning",
          title: `${s.surface} is slow`,
          detail: `95th-percentile response is ${(s.p95 / 1000).toFixed(1)}s.`,
        });
      }
      if (s.total >= MIN_SAMPLE && s.cacheHitRate !== null && s.cacheHitRate < CACHE_HIT_WARNING) {
        alerts.push({
          level: "warning",
          title: `${s.surface} cache is cold`,
          detail: `Only ${pct(s.cacheHitRate)} of requests were served from cache.`,
        });
      }
    }

    if (quota.globalPct >= QUOTA_WARNING_PCT) {
      alerts.push({
        level: quota.globalPct >= QUOTA_CRITICAL_PCT ? "critical" : "warning",
        title: "Daily AI quota nearly spent",
        detail: `${quota.globalUsed} of ${quota.globalLimit} AI calls used today (${pct(quota.globalPct)}).`,
      });
    }
    const budgetPct = Math.max(budget.pct, budget.projected / MONTHLY_API_LIMIT);
    if (budgetPct >= BUDGET_WARNING_PCT) {
      alerts.push({
        level: budgetPct >= BUDGET_CRITICAL_PCT ? "critical" : "warning",
        title: "Monthly API budget under pressure",
        detail: `${budget.used.toLocaleString()} of ${MONTHLY_API_LIMIT.toLocaleString()} calls used this month; on track for ${budget.projected.toLocaleString()}.`,
      });
    }
    if (rateLimited > 0) {
      alerts.push({
        level: "warning",
        title: "Visitors are hitting rate limits",
        detail: `${rateLimited} request(s) were turned away in the last ${data.hours}h.`,
      });
    }

    return {
      locked: false,
      health: {
        windowHours: data.hours,
        totals: { calls, errors, rateLimited, errorRate: calls ? errors / calls : 0 },
        surfaces,
        series,
        quota,
        budget,
        alerts,
      },
    };
  });
