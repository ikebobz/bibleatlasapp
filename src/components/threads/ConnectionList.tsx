import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { neighbours } from "@/lib/threads/graph";
import { THEME_LABEL, themeColor, type ThreadTheme } from "@/lib/threads/types";
import { parseReference } from "@/lib/bible";

export function ThemeDot({ theme }: { theme: ThreadTheme }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: themeColor(theme) }}
      aria-hidden
    />
  );
}

export function PassageLink({ refText, className }: { refText: string; className?: string }) {
  const target = parseReference(refText);
  const base =
    "scripture inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors " +
    (className ?? "");
  if (!target) return <span className={base}>{refText}</span>;
  return (
    <Link
      to="/$book/$chapter"
      params={{ book: target.book, chapter: String(target.chapter) }}
      className={base + " hover:text-primary"}
    >
      {refText}
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  );
}

/** Every authored connection for a node, grouped by theme. */
export function ConnectionList({
  nodeId,
  activeThemes,
  onSelectNode,
}: {
  nodeId: string;
  activeThemes?: Set<ThreadTheme>;
  onSelectNode?: (id: string) => void;
}) {
  const all = neighbours(nodeId);
  const visible =
    activeThemes && activeThemes.size
      ? all.filter((n) => activeThemes.has(n.edge.theme))
      : all;

  if (!visible.length) {
    return (
      <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
        No connections match the current filter.
      </p>
    );
  }

  const groups = new Map<ThreadTheme, typeof visible>();
  for (const n of visible) {
    if (!groups.has(n.edge.theme)) groups.set(n.edge.theme, []);
    groups.get(n.edge.theme)!.push(n);
  }

  return (
    <div className="space-y-7">
      {[...groups.entries()].map(([theme, items]) => (
        <section key={theme} className="space-y-2">
          <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <ThemeDot theme={theme} />
            {THEME_LABEL[theme]}
          </h4>
          <div className="divide-y divide-connections-line border-y border-connections-line">
            {items.map(({ edge, node, direction }) => (
              <article
                key={edge.from + edge.to + edge.label}
                className="py-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectNode?.(node.id)}
                    disabled={!onSelectNode}
                    className="min-h-11 text-left font-connections-display text-lg font-medium text-foreground underline-offset-4 disabled:cursor-default enabled:hover:text-primary enabled:hover:underline"
                  >
                    {node.label}
                  </button>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {edge.strength === "direct" ? "Direct" : "Echo"}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {direction === "out" ? "points forward to" : "grows out of"} · {edge.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{edge.explanation}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <PassageLink refText={node.ref} />
                  {edge.support?.map((s) => (
                    <PassageLink key={s} refText={s} />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
