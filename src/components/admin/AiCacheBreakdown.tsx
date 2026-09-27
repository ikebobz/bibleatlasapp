/**
 * Live per-verse and per-word view of the shared AI answer store.
 *
 * Hits are reuses served without an AI call; misses are the one generation
 * each stored answer cost. Refreshes itself while the tab is visible.
 */

import { useServerFn } from "@tanstack/react-start";
import { BookOpen, RefreshCw, Type } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getAiCacheBreakdown,
  type AiCacheBreakdown as Breakdown,
  type AiCacheBreakdownRow,
} from "@/lib/admin/ai-cache.functions";

const POLL_MS = 15_000;

const KINDS = [
  { value: "", label: "All features" },
  { value: "lexicon", label: "Word explanations" },
  { value: "context", label: "Place & context" },
  { value: "purpose", label: "Artifact purpose" },
  { value: "thread", label: "Connections" },
  { value: "audio", label: "Pronunciation" },
] as const;

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function stamp(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function Table({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: AiCacheBreakdownRow[];
}) {
  return (
    <div className="min-w-0 space-y-2">
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </h3>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2 text-right">Hits</th>
              <th className="px-3 py-2 text-right">Misses</th>
              <th className="px-3 py-2 text-right">Tokens saved</th>
              <th className="px-3 py-2 text-right">Last used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t">
                <td className="max-w-[16rem] truncate px-3 py-2 font-medium text-foreground">
                  {r.label}
                </td>
                <td className="px-3 py-2 text-right">{r.reuses.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.entries.toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{r.tokensSaved.toLocaleString()}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{stamp(r.lastUsed)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-muted-foreground">
                  Nothing matches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AiCacheBreakdownPanel() {
  const fetchBreakdown = useServerFn(getAiCacheBreakdown);
  const [data, setData] = useState<Breakdown | null>(null);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<string>("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"hits" | "tokens">("tokens");
  const kindRef = useRef(kind);
  kindRef.current = kind;

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const result = await fetchBreakdown({
        data: { kind: (kindRef.current || null) as never, limit: 100 },
      });
      if (result.locked) setLocked(true);
      else {
        setLocked(false);
        setData(result.data);
      }
    } catch {
      /* transient: the next poll retries */
    } finally {
      setBusy(false);
    }
  }, [fetchBreakdown]);

  useEffect(() => {
    void load();
  }, [load, kind]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void load();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [load]);

  const shape = useCallback(
    (rows: AiCacheBreakdownRow[]) => {
      const needle = query.trim().toLowerCase();
      return rows
        .filter((r) => !needle || r.label.toLowerCase().includes(needle))
        .slice()
        .sort((a, b) => (sort === "hits" ? b.reuses - a.reuses : b.tokensSaved - a.tokensSaved))
        .slice(0, 25);
    },
    [query, sort],
  );

  const byReference = useMemo(() => shape(data?.byReference ?? []), [data, shape]);
  const byTerm = useMemo(() => shape(data?.byTerm ?? []), [data, shape]);

  if (locked) return null;

  const t = data?.totals;

  return (
    <section className="space-y-4 rounded-2xl border p-5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Per verse and word</h2>
          <p className="text-[11px] text-muted-foreground">
            Live · updated {data ? stamp(data.generatedAt) : "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter verse or word"
            aria-label="Filter by verse or word"
            className="h-8 rounded-full border bg-background px-3 text-[12px]"
          />
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            aria-label="Filter by feature"
            className="h-8 rounded-full border bg-background px-2 text-[12px]"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "hits" | "tokens")}
            aria-label="Sort rows"
            className="h-8 rounded-full border bg-background px-2 text-[12px]"
          >
            <option value="tokens">Sort by tokens saved</option>
            <option value="hits">Sort by hits</option>
          </select>
          <button
            type="button"
            onClick={() => void load()}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] transition-colors hover:bg-muted"
          >
            <RefreshCw className={`h-3 w-3 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: "Hits (reuses)", value: (t?.hits ?? 0).toLocaleString() },
          { label: "Misses (generated)", value: (t?.misses ?? 0).toLocaleString() },
          { label: "Hit rate", value: pct(t?.hitRate ?? 0) },
          { label: "Tokens saved", value: (t?.tokensSaved ?? 0).toLocaleString() },
          { label: "AI calls avoided", value: (t?.callsAvoided ?? 0).toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-muted/30 p-3">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-5 lg:grid-cols-2">
        <Table
          title="Top verses"
          icon={<BookOpen className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
          rows={byReference}
        />
        <Table
          title="Top words"
          icon={<Type className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
          rows={byTerm}
        />
      </div>
    </section>
  );
}
