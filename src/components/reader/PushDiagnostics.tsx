import { AlertTriangle, Check, Copy, Loader2, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { runPushDiagnostics, type DiagnosticsReport } from "@/lib/push/diagnostics";
import { SITE_URL } from "@/lib/site";

const ICON = {
  pass: Check,
  warn: AlertTriangle,
  fail: X,
} as const;

const TONE = {
  pass: "text-emerald-600",
  warn: "text-amber-600",
  fail: "text-destructive",
} as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Runs the normal activation flow when diagnostics say the device is simply off. */
  onTurnOn: () => void;
};

/** Explains, in plain language, why daily verse notifications aren't arriving. */
export function PushDiagnostics({ open, onOpenChange, onTurnOn }: Props) {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    try {
      setReport(await runPushDiagnostics());
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    if (open) void run();
  }, [open, run]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Daily verse diagnostics</DialogTitle>
          <DialogDescription>
            {running && !report
              ? "Checking this device…"
              : (report?.summary ?? "Checking this device…")}
          </DialogDescription>
        </DialogHeader>

        {report && (
          <ul className="space-y-3">
            {report.checks.map((check) => {
              const Icon = ICON[check.state];
              return (
                <li key={check.id} className="flex gap-2.5">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONE[check.state]}`} aria-hidden />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">{check.label}</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {check.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void run()}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Re-run checks
          </button>

          {report?.verdict === "off" && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onTurnOn();
              }}
              className="rounded-lg border border-primary px-3 py-1.5 text-[11px] text-primary transition-colors hover:bg-primary/10"
            >
              Turn on Daily verse
            </button>
          )}

          {(report?.verdict === "worker" || report?.verdict === "blocked") && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border px-3 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted"
            >
              Reload page
            </button>
          )}

          {report?.verdict === "context" && (
            <a
              href={SITE_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-3 py-1.5 text-[11px] text-foreground transition-colors hover:bg-muted"
            >
              Open published site
            </a>
          )}

          {report && (
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(report.raw).then(() => {
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied" : "Copy report"}
            </button>
          )}
        </div>

        {report && (
          <pre className="whitespace-pre-wrap break-all rounded-lg border bg-muted/40 p-2 text-[10px] leading-relaxed text-muted-foreground">
            {report.raw}
          </pre>
        )}
      </DialogContent>
    </Dialog>
  );
}
