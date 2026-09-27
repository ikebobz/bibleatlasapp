import { createFileRoute, useRouter } from "@tanstack/react-router";
import { RefreshCw, Share2, Smartphone, Sparkles } from "lucide-react";

import type React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  adminLogin,
  listPushDevices,
  requestAdminEmailLogin,
  type AdminDevice,
} from "@/lib/admin/gate.functions";

import {
  getWhatsNewStats,
  type WhatsNewStatRow,
  type WhatsNewStatsResult,
} from "@/lib/admin/whats-new-stats.functions";
import { getShareStats, type ShareStatsResult } from "@/lib/admin/share-stats.functions";
import { getOpsHealth } from "@/lib/admin/ops-health.functions";
import { OpsHealthPanel } from "@/components/admin/OpsHealthPanel";
import { AiCachePanel } from "@/components/admin/AiCachePanel";
import { AiCacheBreakdownPanel } from "@/components/admin/AiCacheBreakdown";
import { getAiCacheReport } from "@/lib/admin/ai-cache.functions";


export const Route = createFileRoute("/admin/devices")({
  head: () => ({
    meta: [
      { title: "Push devices — Bible Atlas admin" },
      { name: "description", content: "Internal view of registered daily-verse notification devices." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Push devices — Bible Atlas admin" },
      { property: "og:description", content: "Internal view of registered notification devices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => {
    const [devices, whatsNew, shares, health, aiCache] = await Promise.all([
      listPushDevices(),
      getWhatsNewStats(),
      getShareStats(),
      getOpsHealth({ data: { hours: 24 } }),
      getAiCacheReport(),
    ]);
    return { devices, whatsNew, shares, health, aiCache };
  },
  component: AdminDevicesPage,
});


function ShareStatsPanel({ result }: { result: ShareStatsResult }) {
  if (result.locked) return null;
  const s = result.stats;
  const tiles = [
    { label: "Share opened", value: s.opened },
    { label: "Shares sent", value: s.sent },
    { label: "Arrivals on shared links", value: s.arrivals },
    { label: "Install prompts", value: s.installsShown },
    { label: "Installs accepted", value: s.installsAccepted },
    { label: "Devices", value: s.devices },
  ];

  return (
    <section className="mt-14">
      <h2 className="scripture flex items-center gap-2 text-2xl text-foreground">
        <Share2 className="h-5 w-5 text-primary" />
        Sharing and deep links
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Anonymous counts of verses shared, the channels readers pick, and visits that arrive on a
        shared link.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border p-4">
            <p className="text-2xl text-foreground">{t.value.toLocaleString()}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {t.label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Channels
          </h3>
          {s.channels.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No shares recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {s.channels.map((c) => (
                <li key={c.channel} className="flex justify-between">
                  <span className="capitalize text-muted-foreground">{c.channel}</span>
                  <span className="text-foreground">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Most shared verses
          </h3>
          {s.topVerses.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No shares recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {s.topVerses.map((v) => (
                <li key={v.reference} className="flex justify-between gap-3">
                  <span className="truncate text-muted-foreground">{v.reference}</span>
                  <span className="text-foreground">{v.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function WhatsNewStats({ result }: { result: WhatsNewStatsResult }) {
  if (result.locked) return null;

  return (
    <section className="mt-14">
      <h2 className="scripture flex items-center gap-2 text-2xl text-foreground">
        <Sparkles className="h-5 w-5 text-primary" />
        What's new reach
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Anonymous per-release counts for the release-notes banner: how many readers saw it, tapped
        through, or dismissed it.
      </p>

      {result.rows.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No events recorded yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Release</th>
                <th className="px-4 py-3 text-right font-medium">Devices</th>
                <th className="px-4 py-3 text-right font-medium">Impressions</th>
                <th className="px-4 py-3 text-right font-medium">Clicks</th>
                <th className="px-4 py-3 text-right font-medium">Dismissed</th>
                <th className="px-4 py-3 text-right font-medium">Menu link</th>
                <th className="px-4 py-3 text-right font-medium">Page views</th>
                <th className="px-4 py-3 text-right font-medium">CTR</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row: WhatsNewStatRow) => (
                <tr key={row.version} className="border-t">
                  <td className="px-4 py-3 font-medium text-foreground">v{row.version}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{row.devices}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{row.impressions}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{row.clicks}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{row.dismissals}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{row.navClicks}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{row.pageViews}</td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {Math.round(row.clickThrough * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatStamp(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminLock() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <section className="w-full max-w-sm rounded-xl border p-6">
        <h1 className="scripture text-2xl text-foreground">Admin access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is private. Sign in with the passcode, or have a one-time link emailed to you.
        </p>

        <form
          className="mt-5 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setMessage(null);
            const result = await adminLogin({ data: { passcode } }).catch(() => ({
              ok: false as const,
              reason: "error" as const,
            }));
            setBusy(false);
            if (result.ok) {
              router.invalidate();
              return;
            }
            setMessage(
              result.reason === "locked"
                ? "Too many attempts. Try again shortly."
                : "That passcode did not work.",
            );
          }}
        >
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            type="password"
            value={passcode}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasscode(e.target.value)}
            placeholder="Passcode"
            aria-label="Admin passcode"
            autoComplete="current-password"
          />
          <Button type="submit" className="w-full" disabled={busy || passcode.length === 0}>
            {busy ? "Checking…" : "Unlock"}
          </Button>
        </form>

        <form
          className="mt-6 space-y-3 border-t pt-6"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setMessage(null);
            const result = await requestAdminEmailLogin({ data: { email } }).catch(() => ({
              ok: false as const,
              reason: "unavailable" as const,
            }));
            setBusy(false);
            setMessage(
              result.ok
                ? "If that address is the admin address, a sign-in link is on its way."
                : "Could not send a link right now. Try again later.",
            );
          }}
        >
          <input
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="Admin email"
            aria-label="Admin email"
            autoComplete="email"
          />
          <Button type="submit" variant="outline" className="w-full" disabled={busy || !email}>
            Email me a sign-in link
          </Button>
        </form>

        {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
      </section>
    </main>
  );
}

function AdminDevicesPage() {
  const loaded = Route.useLoaderData();
  const data = loaded.devices;
  const router = useRouter();

  if (data.locked) return <AdminLock />;
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 px-4 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3">
          <Smartphone className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">Push devices</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {data.total} device{data.total === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={() => router.invalidate()}
            aria-label="Refresh"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <h1 className="scripture text-3xl text-foreground">Registered devices</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every browser subscribed to the daily verse. Endpoints are masked; only the provider and
          the last characters are shown.
        </p>

        {data.devices.length === 0 ? (
          <p className="mt-12 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No devices registered yet.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Endpoint</th>
                  <th className="px-4 py-3 font-medium">Registered</th>
                  <th className="px-4 py-3 font-medium">Last sent</th>
                  <th className="px-4 py-3 text-right font-medium">Failures</th>
                </tr>
              </thead>
              <tbody>
                {data.devices.map((device: AdminDevice) => (
                  <tr key={device.id} className="border-t">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {device.endpoint}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatStamp(device.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatStamp(device.lastSentAt)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${
                        device.failureCount > 0 ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {device.failureCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <OpsHealthPanel result={loaded.health} />
        <div className="mt-14 space-y-6">
          <AiCachePanel result={loaded.aiCache} />
          {!loaded.aiCache.locked && <AiCacheBreakdownPanel />}
        </div>
        <WhatsNewStats result={loaded.whatsNew} />
        <ShareStatsPanel result={loaded.shares} />

      </main>
    </div>
  );
}
