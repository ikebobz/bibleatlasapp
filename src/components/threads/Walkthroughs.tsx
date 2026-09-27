import { Link } from "@tanstack/react-router";
import { ArrowRight, X } from "lucide-react";
import { NODE_BY_ID, WALKTHROUGHS } from "@/lib/threads/graph";
import { THEME_LABEL, themeColor } from "@/lib/threads/types";
import { PassageLink } from "./ConnectionList";

export function WalkthroughList({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {WALKTHROUGHS.map((w) => (
        <button
          key={w.id}
          type="button"
          onClick={() => onOpen(w.id)}
          className="group block w-full rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
          style={{ borderLeft: `2px solid ${themeColor(w.theme)}` }}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="scripture text-sm font-medium text-foreground">{w.title}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{w.blurb}</span>
          <span className="mt-1.5 block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {THEME_LABEL[w.theme]} · {w.stops.length} stops
          </span>
        </button>
      ))}
    </div>
  );
}

export function WalkthroughView({
  id,
  onClose,
  onSelectNode,
  returnHref,
  returnLabel,
}: {
  id: string;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
  returnHref?: string;
  returnLabel?: string;
}) {
  const walk = WALKTHROUGHS.find((w) => w.id === id);
  if (!walk) return null;

  return (
    <div className="space-y-4">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            {THEME_LABEL[walk.theme]} walkthrough
          </p>
          <h1 className="scripture text-2xl leading-tight text-foreground">{walk.title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{walk.blurb}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close walkthrough"
          className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <ol className="relative ml-1 space-y-4 border-l pl-5">
        {walk.stops.map((stop, i) => {
          const node = NODE_BY_ID[stop.node];
          if (!node) return null;
          return (
            <li key={stop.node} className="relative">
              <span
                className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background"
                style={{ backgroundColor: themeColor(walk.theme) }}
              />
              <button
                type="button"
                onClick={() => onSelectNode(node.id)}
                className="text-left text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                {node.label}
              </button>
              <span className="ml-2 text-[11px] text-muted-foreground">{i + 1}</span>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{stop.note}</p>
              <div className="mt-1">
                <PassageLink refText={node.ref} />
              </div>
            </li>
          );
        })}
      </ol>

      {returnHref ? (
        <a href={returnHref} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Back to {returnLabel}</a>
      ) : (
        <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">Back to reading</Link>
      )}
    </div>
  );
}
