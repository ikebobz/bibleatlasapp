import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";

import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = {
  /** Short human label used in the fallback copy, e.g. "map" or "context panel". */
  label: string;
  children: ReactNode;
  /** Optional skeleton shown while a lazy/suspending child loads. */
  fallback?: ReactNode;
};

type State = { error: Error | null };

/**
 * Keeps one panel's failure inside that panel. Without this a throwing atlas
 * block, graph or artifact viewer bubbles all the way to the root error page
 * and takes the Scripture text down with it.
 */
export class PanelBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label}]`, error);
    reportLovableError(error, {
      boundary: "panel_boundary",
      panel: this.props.label,
      componentStack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-center">
          <AlertTriangle className="mx-auto h-4 w-4 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">
            This {this.props.label} didn&apos;t load. The rest of the page is unaffected.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-3 w-3" />
            Try again
          </button>
        </div>
      );
    }

    return <Suspense fallback={this.props.fallback ?? null}>{this.props.children}</Suspense>;
  }
}

/** Small neutral placeholder for suspended panels. */
export function PanelSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-3 w-full animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
