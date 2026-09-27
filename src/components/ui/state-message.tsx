import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateKind = "loading" | "empty" | "error" | "offline";

const ICONS = { loading: Loader2, empty: Inbox, error: AlertTriangle, offline: WifiOff } as const;

export function StateMessage({
  kind,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  kind: StateKind;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
  className?: string;
}) {
  const Icon = ICONS[kind];
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "loading" ? "polite" : undefined}
      className={cn(
        "rounded-lg border border-dashed bg-muted/20 text-center",
        compact ? "p-4" : "p-7",
        className,
      )}
    >
      <Icon className={cn("mx-auto h-5 w-5 text-muted-foreground", kind === "loading" && "animate-spin")} aria-hidden />
      <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? (
        <Button type="button" variant="outline" size="sm" onClick={action.onClick} className="mt-3 min-h-11">
          {kind === "error" ? <RefreshCw aria-hidden /> : null}
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function LiveStatus({ children }: { children: ReactNode }) {
  return <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{children}</span>;
}