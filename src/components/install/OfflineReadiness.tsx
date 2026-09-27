import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, Check, Info, Loader2, RefreshCw } from "lucide-react";

import { runReadinessChecks, type ReadinessCheck } from "@/lib/pwa/readiness";
import { ensureServiceWorker } from "@/lib/pwa/register-sw";
import { startDownload } from "@/lib/offline/kjv-download";
import { DEFAULT_TRANSLATION } from "@/lib/translations";

function StatusIcon({ status }: { status: ReadinessCheck["status"] }) {
  if (status === "ready") return <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />;
  if (status === "missing")
    return <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />;
  return <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />;
}

/** Checklist that tells the visitor whether offline reading will actually work. */
export function OfflineReadiness() {
  const [checks, setChecks] = useState<ReadinessCheck[] | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    try {
      setChecks(await runReadinessChecks());
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run]);

  const enableOffline = useCallback(async () => {
    setBusy(true);
    try {
      await ensureServiceWorker();
    } finally {
      await run();
    }
  }, [run]);

  const download = useCallback(async () => {
    void startDownload(DEFAULT_TRANSLATION);
    await run();
  }, [run]);

  return (
    <section className="rounded-xl border bg-surface-raised p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Offline readiness</h2>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Re-check
        </button>
      </div>

      {!checks ? (
        <p className="mt-4 text-sm text-muted-foreground">Checking this device…</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {checks.map((check) => (
            <li key={check.id} className="flex items-start gap-2.5">
              <StatusIcon status={check.status} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground">{check.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{check.detail}</p>
                {check.action === "register" && (
                  <button
                    type="button"
                    onClick={() => void enableOffline()}
                    disabled={busy}
                    className="mt-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    Enable offline
                  </button>
                )}
                {check.action === "download" && (
                  <button
                    type="button"
                    onClick={() => void download()}
                    className="mt-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Download the Bible
                  </button>
                )}
                {check.action === "install" && (
                  <Link
                    to="/install"
                    hash="steps"
                    className="mt-1.5 inline-block text-xs text-foreground underline underline-offset-2"
                  >
                    See install steps
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
