/**
 * Makes staleness visible: which build this device is running versus which one
 * the site is serving, with a one-tap way to force the latest.
 */

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { checkForNewBuild } from "@/lib/pwa/version-check";

function localBuildId(): string {
  try {
    return typeof __BUILD_ID__ === "string" ? __BUILD_ID__ : "unknown";
  } catch {
    return "unknown";
  }
}

function short(id: string) {
  return id.length > 12 ? `${id.slice(0, 12)}…` : id;
}

export function BuildFreshness() {
  const [served, setServed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const local = localBuildId();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/public/build", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { buildId?: string };
      setServed(typeof data.buildId === "string" ? data.buildId : null);
    } catch {
      /* offline: leave unknown */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stale = served !== null && served !== local;

  const refresh = async () => {
    setBusy(true);
    const reloading = await checkForNewBuild(true);
    if (!reloading) {
      await load();
      // No worker swap available (dev/preview) — bypass the HTTP cache directly.
      if (stale) {
        const url = new URL(window.location.href);
        url.searchParams.set("_v", Date.now().toString(36));
        window.location.replace(url.toString());
        return;
      }
    }
    setBusy(false);
  };

  return (
    <section className="mt-8 rounded-xl border bg-surface-raised p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {stale ? "An update is available" : "You're on the latest version"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Running build <code className="font-mono">{short(local)}</code>
            {served ? (
              <>
                {" "}
                · site is serving <code className="font-mono">{short(served)}</code>
              </>
            ) : (
              " · couldn't reach the server"
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          <RefreshCw className={`h-3 w-3 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Checking…" : "Get the latest version"}
        </button>
      </div>
    </section>
  );
}
