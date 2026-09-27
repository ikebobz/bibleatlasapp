import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Map as MapIcon } from "lucide-react";
import { Artifact3D } from "./Artifact3D";
import { ConnectionList } from "@/components/threads/ConnectionList";
import { MAP_FEATURE_BY_ID } from "@/lib/atlas/catalogue";
import type { Block, TreeNode } from "@/lib/atlas/types";
import { parseReference } from "@/lib/bible";

/** The reading position, so the canonical map can offer a way straight back. */
function useReaderPath() {
  return useRouterState({ select: (state) => state.location.pathname.replace(/^\//, "") });
}

/** Map blocks link into the one canonical map instead of drawing a second one. */
function MapBlockLink({ block }: { block: Extract<Block, { type: "map" }> }) {
  const from = useReaderPath();
  const candidates = [...(block.focus ?? []), ...(block.route?.stops ?? []).map((s) => s.place)];
  const placeId = candidates.find((id) => MAP_FEATURE_BY_ID[id]);
  if (!placeId) return null;
  const feature = MAP_FEATURE_BY_ID[placeId];
  return (
    <Link
      to="/maps"
      search={{ place: placeId, ...(from ? { from } : {}) }}
      className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 transition-colors hover:bg-muted"
    >
      <MapIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="flex-1">
        <span className="block text-sm font-medium text-foreground">
          Open {feature.name} on the map
        </span>
        <span className="block text-xs text-muted-foreground">
          {block.caption ?? "Real terrain, nearby places and journeys"}
        </span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h3>
  );
}

function RefLink({ refText, note }: { refText: string; note: string }) {
  const target = parseReference(refText);
  const inner = (
    <>
      <span className="scripture text-sm font-medium text-foreground">{refText}</span>
      {note && <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{note}</span>}
    </>
  );
  if (!target) {
    return <div className="rounded-lg border border-dashed px-3 py-2">{inner}</div>;
  }
  return (
    <Link
      to="/$book/$chapter"
      params={{ book: target.book, chapter: String(target.chapter) }}
      className="group block rounded-lg border bg-card px-3 py-2 transition-colors hover:border-primary/40 hover:bg-accent/50"
    >
      <span className="flex items-start justify-between gap-2">
        <span>{inner}</span>
        <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
    </Link>
  );
}

function Tree({ node, onOpen, depth = 0 }: { node: TreeNode; onOpen: (id: string) => void; depth?: number }) {
  return (
    <div className={depth === 0 ? "" : "ml-3 border-l pl-4"}>
      <div className="relative py-1">
        {depth > 0 && <span className="absolute -left-4 top-1/2 h-px w-3 bg-border" />}
        <button
          type="button"
          disabled={!node.entry}
          onClick={() => node.entry && onOpen(node.entry)}
          className={
            "text-left text-sm " +
            (node.entry
              ? "font-medium text-primary underline-offset-4 hover:underline"
              : "font-medium text-foreground")
          }
        >
          {node.name}
        </button>
        {node.role && <span className="ml-2 text-xs text-muted-foreground">{node.role}</span>}
      </div>
      {node.children?.map((child) => (
        <Tree key={child.name} node={child} onOpen={onOpen} depth={depth + 1} />
      ))}
    </div>
  );
}

export function BlockView({ block, onOpenEntry }: { block: Block; onOpenEntry: (id: string) => void }) {
  const from = useReaderPath();
  switch (block.type) {
    case "prose":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          {block.body.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground/90">
              {p}
            </p>
          ))}
        </section>
      );

    case "facts":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          <dl className="divide-y rounded-xl border bg-card">
            {block.items.map((it) => (
              <div key={it.label} className="grid grid-cols-[minmax(0,7rem)_1fr] gap-3 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{it.label}</dt>
                <dd className="text-sm text-foreground">{it.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );

    case "map":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          <MapBlockLink block={block} />
        </section>
      );

    case "timeline":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          {block.caption && <p className="text-xs text-muted-foreground">{block.caption}</p>}
          <ol className="relative ml-1 space-y-3 border-l pl-5">
            {block.items.map((item, i) => (
              <li key={i} className="relative">
                <span
                  className={
                    "absolute -left-[1.53rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background " +
                    (item.accent ? "bg-primary" : "bg-muted-foreground/60")
                  }
                />
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  {item.when && (
                    <span className="scripture text-xs text-muted-foreground">{item.when}</span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ol>
        </section>
      );

    case "tree":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          {block.caption && <p className="text-xs text-muted-foreground">{block.caption}</p>}
          <div className="rounded-xl border bg-card px-3 py-2">
            <Tree node={block.root} onOpen={onOpenEntry} />
          </div>
        </section>
      );

    case "refs":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          <div className="space-y-1.5">
            {block.items.map((r) => (
              <RefLink key={r.ref + r.note} refText={r.ref} note={r.note} />
            ))}
          </div>
        </section>
      );

    case "diagram":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          {block.caption && <p className="text-xs text-muted-foreground">{block.caption}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {block.columns.map((col) => (
              <div key={col.title} className="rounded-xl border bg-card p-3">
                <p className="text-sm font-semibold text-foreground">{col.title}</p>
                {col.subtitle && (
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {col.subtitle}
                  </p>
                )}
                <ul className="mt-2 space-y-1.5">
                  {col.items.map((it) => (
                    <li key={it} className="flex gap-2 text-xs leading-relaxed text-foreground/85">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/70" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      );

    case "steps":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          {block.caption && <p className="text-xs text-muted-foreground">{block.caption}</p>}
          <ol className="space-y-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-3 rounded-xl border bg-card p-3">
                <span className="scripture mt-0.5 text-sm text-primary">{i + 1}</span>
                <span>
                  <span className="block text-sm font-medium text-foreground">{item.title}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      );

    case "connections":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          {block.caption && <p className="text-xs text-muted-foreground">{block.caption}</p>}
          <ConnectionList nodeId={block.nodeId} />
          <Link
            to="/connections/$node"
            params={{ node: block.nodeId }}
            search={{ from }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            See this in the connection graph
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </section>
      );

    case "model3d":
      return (
        <section className="space-y-2">
          <Heading>{block.heading}</Heading>
          <Artifact3D artifactId={block.artifactId} />
          {block.caption && (
            <p className="text-xs leading-relaxed text-muted-foreground">{block.caption}</p>
          )}
        </section>
      );
  }
}
