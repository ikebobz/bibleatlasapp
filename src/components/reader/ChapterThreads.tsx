import { Link, useRouterState } from "@tanstack/react-router";
import { Waypoints } from "lucide-react";

import { nodesInChapter } from "@/lib/threads/graph";

/**
 * Strip of thematic threads that pass through the open chapter. Loaded lazily
 * because it pulls in the full threads dataset.
 */
export default function ChapterThreads({ book, chapter }: { book: string; chapter: number }) {
  const from = useRouterState({ select: (state) => state.location.pathname.replace(/^\//, "") });
  const nodes = nodesInChapter(book, chapter);
  if (!nodes.length) return null;
  return (
    <div className="mb-8 rounded-xl border border-dashed bg-muted/30 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Waypoints className="h-3.5 w-3.5 text-primary" />
        {nodes.length} thread{nodes.length === 1 ? "" : "s"} run{nodes.length === 1 ? "s" : ""} through this chapter
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {nodes.map((n) => (
          <Link
            key={n.id}
            to="/connections/$node"
            params={{ node: n.id }}
            search={{ from }}
            className="rounded-full border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            {n.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
