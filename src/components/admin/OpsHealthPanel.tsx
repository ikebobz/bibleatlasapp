import { Activity, AlertTriangle, Database, Gauge, ShieldAlert } from "lucide-react";

import type { OpsHealthResult, SurfaceHealth } from "@/lib/admin/ops-health.functions";

function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

function ms(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`;
}

function Sparkline({ points }: { points: { total: number; errors: number }[] }) {
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.total), 1);
  const step = 100 / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(2)},${(28 - (p.total / max) * 26).toFixed(2)}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="mt-3 h-10 w-full" aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" />
    </svg>
  );
}

function SurfaceRow({ s }: { s: SurfaceHealth }) {
  const bad = s.errorRate >= 0.05;
  return (
    <tr className="border-t">
      <td className="px-4 py-3 font-medium text-foreground">{s.surface}</td>
      <td className="px-4 py-3 text-right text-muted-foreground">{s.total.toLocaleString()}</td>
      <td className={`px-4 py-3 text-right ${bad ? "text-destructive" : "text-muted-foreground"}`}>
        {pct(s.errorRate)}
      </td>
      <td className="px-4 py-3 text-right text-muted-foreground">
        {s.cacheHitRate === null ? "—" : pct(s.cacheHitRate)}
      </td>
      <td className="px-4 py-3 text-right text-muted-foreground">{ms(s.p50)}</td>
      <td className="px-4 py-3 text-right text-foreground">{ms(s.p95)}</td>
      <td className="px-4 py-3 text-right text-muted-foreground">{s.rateLimited}</td>
    </tr>
  );
}

export function OpsHealthPanel({ result }: { result: OpsHealthResult }) {
  if (result.locked) return null;
  const h = result.health;

  const tiles = [
    { label: "Calls", value: h.totals.calls.toLocaleString(), icon: Activity },
    { label: "Error rate", value: pct(h.totals.errorRate), icon: AlertTriangle },
    { label: "Rate limited", value: h.totals.rateLimited.toLocaleString(), icon: ShieldAlert },
    {
      label: "AI quota today",
      value: `${h.quota.globalUsed.toLocaleString()} / ${h.quota.globalLimit.toLocaleString()}`,
      icon: Gauge,
    },
  ];

  return (
    <section className="mt-14">
      <h2 className="scripture flex items-center gap-2 text-2xl text-foreground">
        <Database className="h-5 w-5 text-primary" />
        System health
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Latency, failures, cache effectiveness and AI quota usage across the last {h.windowHours}{" "}
        hours. Measured on the server for every Scripture and AI request.
      </p>

      {h.alerts.length > 0 && (
        <ul className="mt-6 space-y-2">
          {h.alerts.map((a, i) => (
            <li
              key={`${a.title}-${i}`}
              className={`flex gap-3 rounded-xl border p-3 text-sm ${
                a.level === "critical"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-amber-500/40 bg-amber-500/5"
              }`}
            >
              <AlertTriangle
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  a.level === "critical" ? "text-destructive" : "text-amber-600"
                }`}
              />
              <span>
                <span className="font-medium text-foreground">{a.title}</span>{" "}
                <span className="text-muted-foreground">{a.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border p-4">
            <t.icon className="h-4 w-4 text-muted-foreground" />
            <p className="mt-2 text-xl text-foreground">{t.value}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {t.label}
            </p>
          </div>
        ))}
      </div>

      {h.series.length > 1 && (
        <div className="mt-6 rounded-xl border p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Requests per hour
          </h3>
          <Sparkline points={h.series} />
          <p className="mt-1 text-xs text-muted-foreground">
            Peak {Math.max(...h.series.map((p) => p.total))} per hour · worst p95{" "}
            {ms(Math.max(...h.series.map((p) => p.p95)))}
          </p>
        </div>
      )}

      {h.surfaces.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No activity recorded in this window yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Surface</th>
                <th className="px-4 py-3 text-right font-medium">Calls</th>
                <th className="px-4 py-3 text-right font-medium">Errors</th>
                <th className="px-4 py-3 text-right font-medium">Cache hits</th>
                <th className="px-4 py-3 text-right font-medium">p50</th>
                <th className="px-4 py-3 text-right font-medium">p95</th>
                <th className="px-4 py-3 text-right font-medium">Limited</th>
              </tr>
            </thead>
            <tbody>
              {h.surfaces.map((s) => (
                <SurfaceRow key={s.surface} s={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Busiest visitor today used {h.quota.busiestVisitor} of {h.quota.visitorDailyLimit} AI
        lookups · {h.quota.visitorsToday} visitor(s) made AI requests.
      </p>

      <div className="mt-6 rounded-lg border border-border/60 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Monthly API budget · {h.budget.month}</h3>
          <p className="text-xs text-muted-foreground">
            {h.budget.used.toLocaleString()} of {h.budget.monthlyLimit.toLocaleString()} external
            calls · {h.budget.today.toLocaleString()} today
          </p>
        </div>

        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(h.budget.pct * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Monthly API budget used"
        >
          <div
            className={`h-full rounded-full ${h.budget.pct >= 0.85 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${Math.min(100, Math.round(h.budget.pct * 100))}%` }}
          />
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          On track for {h.budget.projected.toLocaleString()} calls this month. Only real upstream
          requests count — anything served from cache is free.
        </p>

        {h.budget.byFeature.length > 0 && (
          <ul className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
            {h.budget.byFeature.map((f) => (
              <li key={`${f.provider}:${f.feature}`} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {f.feature} <span className="opacity-60">({f.provider})</span>
                </span>
                <span className="font-medium tabular-nums">{f.calls.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
