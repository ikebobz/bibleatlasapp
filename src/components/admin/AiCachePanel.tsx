import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Recycle, RefreshCw, ShieldOff } from "lucide-react";
import { useState } from "react";

import {
  updateAiCacheEntry,
  type AiCacheResult,
} from "@/lib/admin/ai-cache.functions";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function AiCachePanel({ result }: { result: AiCacheResult }) {
  const router = useRouter();
  const update = useServerFn(updateAiCacheEntry);
  const [busy, setBusy] = useState<string | null>(null);

  if (result.locked) return null;
  const { totals, byKind, top } = result.report;

  const act = async (cacheKey: string, action: "disable" | "enable" | "regenerate") => {
    setBusy(cacheKey);
    try {
      await update({ data: { cacheKey, action } });
      await router.invalidate();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border p-5">
      <header className="flex items-center gap-2">
        <Recycle className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Shared AI answers</h2>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Cached answers", value: totals.entries.toLocaleString() },
          { label: "Reuses (no AI call)", value: totals.reuses.toLocaleString() },
          { label: "Reuse rate", value: pct(totals.hitRate) },
          { label: "Tokens avoided", value: totals.tokensAvoided.toLocaleString() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-muted/30 p-3">
            <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-foreground">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="py-2 pr-4">Feature</th>
              <th className="py-2 pr-4">Entries</th>
              <th className="py-2 pr-4">Active</th>
              <th className="py-2 pr-4">Reuses</th>
              <th className="py-2">Tokens avoided</th>
            </tr>
          </thead>
          <tbody>
            {byKind.map((k) => (
              <tr key={k.kind} className="border-t">
                <td className="py-2 pr-4 font-medium text-foreground">{k.kind}</td>
                <td className="py-2 pr-4">{k.entries.toLocaleString()}</td>
                <td className="py-2 pr-4">{k.active.toLocaleString()}</td>
                <td className="py-2 pr-4">{k.reuses.toLocaleString()}</td>
                <td className="py-2">{k.tokensAvoided.toLocaleString()}</td>
              </tr>
            ))}
            {byKind.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-muted-foreground">
                  Nothing cached yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Most reused answers
        </h3>
        <ul className="space-y-2">
          {top.map((e) => (
            <li key={e.cacheKey} className="rounded-xl border px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {e.term}
                    {e.reference ? ` — ${e.reference}` : ""}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {e.kind} · v{e.promptVersion}
                    {e.translation ? ` · ${e.translation.toUpperCase()}` : ""} · {e.usageCount}{" "}
                    reuse{e.usageCount === 1 ? "" : "s"} · {e.status}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={busy === e.cacheKey}
                    onClick={() => act(e.cacheKey, e.status === "active" ? "disable" : "enable")}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors hover:bg-muted"
                  >
                    <ShieldOff className="h-3 w-3" />
                    {e.status === "active" ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === e.cacheKey}
                    onClick={() => act(e.cacheKey, "regenerate")}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors hover:bg-muted"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </button>
                </div>
              </div>
            </li>
          ))}
          {top.length === 0 && (
            <li className="text-[13px] text-muted-foreground">No answers cached yet.</li>
          )}
        </ul>
      </div>
    </section>
  );
}
