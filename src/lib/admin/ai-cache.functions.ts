/**
 * Admin view over the shared AI answer store: what has been generated, how
 * often each answer has been reused, how many tokens that reuse avoided, and
 * controls to disable or regenerate a bad answer.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AiCacheKindRow = {
  kind: string;
  entries: number;
  active: number;
  reuses: number;
  tokensStored: number;
  tokensAvoided: number;
};

export type AiCacheEntry = {
  cacheKey: string;
  kind: string;
  term: string;
  reference: string;
  translation: string | null;
  promptVersion: number;
  status: string;
  usageCount: number;
  tokens: number;
  model: string;
  createdAt: string;
  lastAccessedAt: string | null;
};

export type AiCacheReport = {
  totals: { entries: number; reuses: number; tokensAvoided: number; hitRate: number };
  byKind: AiCacheKindRow[];
  top: AiCacheEntry[];
};

export type AiCacheResult = { locked: true } | { locked: false; report: AiCacheReport };

type EntryRow = {
  cache_key: string;
  kind: string;
  term: string;
  reference: string;
  translation: string | null;
  prompt_version: number;
  status: string;
  usage_count: number;
  tokens: number;
  model: string;
  created_at: string;
  last_accessed_at: string | null;
};

function toEntry(row: EntryRow): AiCacheEntry {
  return {
    cacheKey: row.cache_key,
    kind: row.kind,
    term: row.term,
    reference: row.reference,
    translation: row.translation,
    promptVersion: row.prompt_version,
    status: row.status,
    usageCount: Number(row.usage_count),
    tokens: Number(row.tokens),
    model: row.model,
    createdAt: row.created_at,
    lastAccessedAt: row.last_accessed_at,
  };
}

export const getAiCacheReport = createServerFn({ method: "GET" }).handler(
  async (): Promise<AiCacheResult> => {
    const { isAdminSession } = await import("@/lib/admin/gate.server");
    if (!(await isAdminSession())) return { locked: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as {
      from: (t: string) => any;
      rpc: (fn: string) => Promise<{ data: unknown; error: unknown }>;
    };

    const [overview, entries] = await Promise.all([
      db.rpc("ai_cache_overview"),
      db
        .from("atlas_context")
        .select(
          "cache_key,kind,term,reference,translation,prompt_version,status,usage_count,tokens,model,created_at,last_accessed_at",
        )
        .order("usage_count", { ascending: false })
        .limit(40),
    ]);

    type OverviewRow = {
      kind: string;
      entries: number;
      active: number;
      reuses: number;
      tokens_stored: number;
      tokens_avoided: number;
    };
    const byKind: AiCacheKindRow[] = ((overview.data ?? []) as OverviewRow[]).map((row) => ({
      kind: row.kind,
      entries: Number(row.entries),
      active: Number(row.active),
      reuses: Number(row.reuses),
      tokensStored: Number(row.tokens_stored),
      tokensAvoided: Number(row.tokens_avoided),
    }));

    const totalEntries = byKind.reduce((s, k) => s + k.entries, 0);
    const reuses = byKind.reduce((s, k) => s + k.reuses, 0);
    const tokensAvoided = byKind.reduce((s, k) => s + k.tokensAvoided, 0);

    return {
      locked: false,
      report: {
        totals: {
          entries: totalEntries,
          reuses,
          tokensAvoided,
          // Every entry cost one generation; every reuse was served for free.
          hitRate: reuses + totalEntries ? reuses / (reuses + totalEntries) : 0,
        },
        byKind,
        top: ((entries.data ?? []) as EntryRow[]).map(toEntry),
      },
    };
  },
);

/** Disable a bad answer, re-enable it, or drop it so the next reader regenerates. */
export const updateAiCacheEntry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        cacheKey: z.string().min(1).max(400),
        action: z.enum(["disable", "enable", "regenerate"]),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const { isAdminSession } = await import("@/lib/admin/gate.server");
    if (!(await isAdminSession())) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = (supabaseAdmin as unknown as { from: (t: string) => any }).from("atlas_context");

    if (data.action === "regenerate") {
      await table.delete().eq("cache_key", data.cacheKey);
    } else {
      await table
        .update({ status: data.action === "disable" ? "disabled" : "active" })
        .eq("cache_key", data.cacheKey);
    }
    return { ok: true };
  });

/* ------------------------------------------------------------------ *
 * Live breakdown: which verses and which words are actually reused.
 * ------------------------------------------------------------------ */

export type AiCacheBreakdownRow = {
  label: string;
  entries: number;
  reuses: number;
  tokensStored: number;
  tokensSaved: number;
  lastUsed: string | null;
};

export type AiCacheBreakdown = {
  generatedAt: string;
  kind: string | null;
  totals: {
    hits: number;
    misses: number;
    hitRate: number;
    tokensSaved: number;
    callsAvoided: number;
  };
  byReference: AiCacheBreakdownRow[];
  byTerm: AiCacheBreakdownRow[];
};

export type AiCacheBreakdownResult = { locked: true } | { locked: false; data: AiCacheBreakdown };

type BreakdownRow = {
  label: string;
  entries: number | string;
  reuses: number | string;
  tokens_stored: number | string;
  tokens_saved: number | string;
  last_used: string | null;
};

function toBreakdownRow(row: BreakdownRow): AiCacheBreakdownRow {
  return {
    label: row.label,
    entries: Number(row.entries),
    reuses: Number(row.reuses),
    tokensStored: Number(row.tokens_stored),
    tokensSaved: Number(row.tokens_saved),
    lastUsed: row.last_used,
  };
}

export const getAiCacheBreakdown = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["context", "purpose", "lexicon", "thread", "audio"]).nullish(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }): Promise<AiCacheBreakdownResult> => {
    const { isAdminSession } = await import("@/lib/admin/gate.server");
    if (!(await isAdminSession())) return { locked: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    };

    const args = { _kind: data.kind ?? null, _limit: data.limit ?? 50 };
    const [refs, terms] = await Promise.all([
      db.rpc("ai_cache_by_reference", args),
      db.rpc("ai_cache_by_term", args),
    ]);

    const byReference = ((refs.data ?? []) as BreakdownRow[]).map(toBreakdownRow);
    const byTerm = ((terms.data ?? []) as BreakdownRow[]).map(toBreakdownRow);

    // Every stored answer cost one generation (a miss); every reuse was a hit.
    const misses = byReference.reduce((s, r) => s + r.entries, 0);
    const hits = byReference.reduce((s, r) => s + r.reuses, 0);
    const tokensSaved = byReference.reduce((s, r) => s + r.tokensSaved, 0);

    return {
      locked: false,
      data: {
        generatedAt: new Date().toISOString(),
        kind: data.kind ?? null,
        totals: {
          hits,
          misses,
          hitRate: hits + misses ? hits / (hits + misses) : 0,
          tokensSaved,
          callsAvoided: hits,
        },
        byReference,
        byTerm,
      },
    };
  });
