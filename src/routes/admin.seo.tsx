import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Link2, RefreshCw } from "lucide-react";
import { useState } from "react";

import { MetricSparkline, type SparkPoint } from "@/components/admin/MetricSparkline";
import { getSeoMetrics } from "@/lib/admin/seo-metrics.functions";
import type { SeoSnapshot } from "@/lib/admin/seo-metrics.server";

export const Route = createFileRoute("/admin/seo")({
  head: () => ({
    meta: [
      { title: "SEO link metrics — Bible Atlas admin" },
      {
        name: "description",
        content: "Internal dashboard tracking referring domains and backlink metrics over time.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "SEO link metrics — Bible Atlas admin" },
      {
        property: "og:description",
        content: "Internal dashboard tracking referring domains and backlink metrics over time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => ({ result: await getSeoMetrics({ data: { days: 90, refresh: false } }) }),
  component: SeoDashboard,
});

const nf = new Intl.NumberFormat("en-US");

function fmt(value: number | null): string {
  return value === null ? "—" : nf.format(value);
}

function delta(history: SeoSnapshot[], key: keyof SeoSnapshot): string | null {
  const values = history.map((row) => row[key]).filter((v) => typeof v === "number") as number[];
  if (values.length < 2) return null;
  const change = values[values.length - 1] - values[0];
  if (change === 0) return "no change";
  return `${change > 0 ? "+" : ""}${nf.format(change)} in range`;
}

function StatCard({
  label,
  value,
  trend,
  points,
}: {
  label: string;
  value: string;
  trend: string | null;
  points: SparkPoint[];
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {trend ? <p className="text-xs text-muted-foreground">{trend}</p> : null}
      <MetricSparkline points={points} ariaLabel={`${label} over time`} />
    </div>
  );
}

function SeoDashboard() {
  const { result } = Route.useLoaderData();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  if (result.locked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5">
        <div className="w-full max-w-sm rounded-xl border p-6 text-center">
          <h1 className="scripture text-2xl text-foreground">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in on the admin portal, then come back to this page.
          </p>
          <a
            href="/admin/devices"
            className="mt-5 inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            Go to admin sign-in
          </a>
        </div>
      </div>
    );
  }

  const { target, latest, history, error } = result.metrics;

  const series = (key: keyof SeoSnapshot): SparkPoint[] =>
    history.map((row) => ({
      label: row.capturedOn,
      value: typeof row[key] === "number" ? (row[key] as number) : null,
    }));

  async function refresh() {
    setRefreshing(true);
    try {
      await getSeoMetrics({ data: { days: 90, refresh: true } });
      await router.invalidate();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 px-4 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3">
          <Link2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">SEO link metrics</span>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh from Semrush"
            className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-24 pt-10">
        <h1 className="scripture text-3xl text-foreground">Backlink profile for {target}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Semrush estimates, snapshotted once a day so you can watch link growth over time. Semrush
          sees Google organic data only — real referrals may be higher.
        </p>

        {error ? (
          <p className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
            {error}
          </p>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Referring domains"
            value={fmt(latest?.referringDomains ?? null)}
            trend={delta(history, "referringDomains")}
            points={series("referringDomains")}
          />
          <StatCard
            label="Total backlinks"
            value={fmt(latest?.backlinksTotal ?? null)}
            trend={delta(history, "backlinksTotal")}
            points={series("backlinksTotal")}
          />
          <StatCard
            label="Authority score"
            value={fmt(latest?.authorityScore ?? null)}
            trend={delta(history, "authorityScore")}
            points={series("authorityScore")}
          />
          <StatCard
            label="Referring IPs"
            value={fmt(latest?.referringIps ?? null)}
            trend={delta(history, "referringIps")}
            points={series("referringIps")}
          />
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Link composition
          </h2>
          <table className="mt-3 w-full text-left text-sm">
            <tbody>
              {[
                ["Follow links", latest?.follows ?? null],
                ["Nofollow links", latest?.nofollows ?? null],
                ["Text links", latest?.texts ?? null],
                ["Image links", latest?.images ?? null],
              ].map(([label, value]) => (
                <tr key={String(label)} className="border-t">
                  <th scope="row" className="w-56 py-2 pr-4 text-left font-medium text-muted-foreground">
                    {label as string}
                  </th>
                  <td className="py-2 tabular-nums">{fmt(value as number | null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Top referring domains
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Domain</th>
                  <th className="px-4 py-2">Authority</th>
                  <th className="px-4 py-2">Backlinks</th>
                </tr>
              </thead>
              <tbody>
                {(latest?.topDomains ?? []).map((row) => (
                  <tr key={row.domain} className="border-t">
                    <td className="px-4 py-2 font-mono text-[13px]">{row.domain}</td>
                    <td className="px-4 py-2 tabular-nums">{fmt(row.authorityScore)}</td>
                    <td className="px-4 py-2 tabular-nums">{fmt(row.backlinks)}</td>
                  </tr>
                ))}
                {!latest?.topDomains?.length ? (
                  <tr className="border-t">
                    <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                      No referring domains reported yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Top anchor text
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Anchor</th>
                  <th className="px-4 py-2">Domains</th>
                  <th className="px-4 py-2">Backlinks</th>
                </tr>
              </thead>
              <tbody>
                {(latest?.topAnchors ?? []).map((row) => (
                  <tr key={row.anchor} className="border-t">
                    <td className="px-4 py-2">{row.anchor}</td>
                    <td className="px-4 py-2 tabular-nums">{fmt(row.domains)}</td>
                    <td className="px-4 py-2 tabular-nums">{fmt(row.backlinks)}</td>
                  </tr>
                ))}
                {!latest?.topAnchors?.length ? (
                  <tr className="border-t">
                    <td className="px-4 py-3 text-muted-foreground" colSpan={3}>
                      No anchor data reported yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-10 text-xs text-muted-foreground">Source: Semrush.</p>
      </main>
    </div>
  );
}
