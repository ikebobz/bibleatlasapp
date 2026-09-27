import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Globe, RefreshCw } from "lucide-react";

import { getSiteDiagnostics } from "@/lib/site-diagnostics.functions";

export const Route = createFileRoute("/admin/diagnostics")({
  head: () => ({
    meta: [
      { title: "Domain diagnostics — Bible Atlas admin" },
      {
        name: "description",
        content: "Internal view of the computed canonical domain for this environment.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Domain diagnostics — Bible Atlas admin" },
      {
        property: "og:description",
        content: "Internal view of the computed canonical domain for this environment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: async () => ({ diagnostics: await getSiteDiagnostics() }),
  component: DiagnosticsPage,
});

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <tr className="border-t align-top">
      <th scope="row" className="w-56 py-2 pr-4 text-left font-medium text-muted-foreground">
        {label}
      </th>
      <td className="break-all py-2 font-mono text-[13px] text-foreground">{value ?? "—"}</td>
    </tr>
  );
}

function DiagnosticsPage() {
  const { diagnostics } = Route.useLoaderData();
  const router = useRouter();

  if (diagnostics.locked) {
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

  const d = diagnostics;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 px-4 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">Domain diagnostics</span>
          <button
            type="button"
            onClick={() => router.invalidate()}
            aria-label="Refresh"
            className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <h1 className="scripture text-3xl text-foreground">Computed URLs for this environment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything below is computed on the server that rendered this page, so preview and
          production can be compared directly.
        </p>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Configuration
          </h2>
          <table className="mt-3 w-full text-left text-sm">
            <tbody>
              <Row label="SITE_URL" value={d.siteUrl} />
              <Row label="SITE_HOST" value={d.siteHost} />
              <Row label="Source" value={d.source} />
              <Row label="Configured value" value={d.configuredValue} />
              <Row label="Serving host" value={d.requestHost} />
              <Row
                label="This host redirects to"
                value={d.requestWouldRedirectTo ?? "no redirect (served directly)"}
              />
            </tbody>
          </table>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Canonical, og:url and cards
          </h2>
          <table className="mt-3 w-full text-left text-sm">
            <tbody>
              <Row label="Canonical home" value={d.canonicalHome} />
              <Row label="Verse canonical" value={d.verseCanonical} />
              <Row label="Verse og:url" value={d.verseOgUrl} />
              <Row label="Verse preview card" value={d.verseCardUrl} />
            </tbody>
          </table>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Sitemap and robots
          </h2>
          <table className="mt-3 w-full text-left text-sm">
            <tbody>
              <Row label="Sitemap base" value={d.sitemapBase} />
              <Row label="robots.txt" value={d.robotsSitemapLine} />
              <Row label="Card renderer" value={`${d.cardRender} (${d.cardContentType})`} />
              <Row label="Sample entries" value={d.sitemapSamples.join("\n")} />
            </tbody>
          </table>
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Redirect check
          </h2>
          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-2">Host</th>
                  <th className="px-4 py-2">Result for /john/3/16?s=share</th>
                </tr>
              </thead>
              <tbody>
                {d.redirectChecks.map((check) => (
                  <tr key={check.host} className="border-t">
                    <td className="px-4 py-2 font-mono text-[13px]">{check.host}</td>
                    <td className="break-all px-4 py-2 font-mono text-[13px]">
                      {check.target ? `301 → ${check.target}` : "served directly"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
