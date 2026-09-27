import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { SeoSnapshot } from "@/lib/admin/seo-metrics.server";

export type SeoMetricsData = {
  target: string;
  latest: SeoSnapshot | null;
  history: SeoSnapshot[];
  fetchedAt: string | null;
  error: string | null;
};

export type SeoMetricsResult = { locked: true } | { locked: false; metrics: SeoMetricsData };

/**
 * Reads stored link-metric history and, unless a snapshot already exists for
 * today, pulls a fresh one from Semrush and stores it.
 */
export const getSeoMetrics = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        days: z.number().int().min(7).max(365).default(90),
        refresh: z.boolean().default(false),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<SeoMetricsResult> => {
    const { isAdminSession } = await import("@/lib/admin/gate.server");
    if (!(await isAdminSession())) return { locked: true };
    const { SITE_HOST } = await import("@/lib/site");
    const { fetchSeoSnapshot, readHistory, saveSnapshot, SemrushError } = await import(
      "@/lib/admin/seo-metrics.server"
    );

    const target = SITE_HOST.replace(/^www\./, "");
    let history = await readHistory(target, data.days);
    const today = new Date().toISOString().slice(0, 10);
    const hasToday = history.some((row) => row.capturedOn === today);

    let error: string | null = null;
    if (data.refresh || !hasToday) {
      try {
        const snapshot = await fetchSeoSnapshot(target);
        await saveSnapshot(target, snapshot);
        history = await readHistory(target, data.days);
      } catch (cause) {
        error =
          cause instanceof SemrushError
            ? cause.message
            : "Could not reach Semrush right now. Showing stored data.";
      }
    }

    return {
      locked: false,
      metrics: {
        target,
        latest: history.length ? history[history.length - 1] : null,
        history,
        fetchedAt: new Date().toISOString(),
        error,
      },
    };
  });
