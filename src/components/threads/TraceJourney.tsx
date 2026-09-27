import { ArrowRight, CircleDot, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PassageLink, ThemeDot } from "./ConnectionList";
import { THEME_LABEL } from "@/lib/threads/types";
import type { ThreadEdge, ThreadNode } from "@/lib/threads/graph";

type PathStep = { node: ThreadNode; edge?: ThreadEdge };

function Stop({ node, index, total, onOpen }: { node: ThreadNode; index: number; total: number; onOpen: (id: string) => void }) {
  const final = index === total - 1;
  return (
    <li className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 animate-thread-reveal" style={{ animationDelay: `${index * 90}ms` }}>
      <span className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 bg-background ring-8 ring-background ${final ? "border-connections-gold text-connections-gold" : "border-foreground text-foreground"}`}>
        {final ? <Sparkles className="h-4 w-4" aria-hidden /> : <CircleDot className="h-4 w-4" aria-hidden />}
      </span>
      <div className="min-w-0 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{index === 0 ? "Beginning" : final ? "Destination" : `Step ${index + 1}`} · {node.kind}</p>
        <button type="button" onClick={() => onOpen(node.id)} className="mt-1 text-left font-connections-display text-2xl leading-tight text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {node.label}
        </button>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{node.summary}</p>
        <p className="mt-2"><PassageLink refText={node.ref} className="!min-h-11 !text-foreground" /></p>
      </div>
    </li>
  );
}

function Bridge({ edge, index }: { edge: ThreadEdge; index: number }) {
  return (
    <li className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 animate-thread-reveal" style={{ animationDelay: `${index * 90 + 45}ms` }}>
      <span className="flex justify-center"><span className="relative z-10 mt-4 h-2.5 w-2.5 rounded-full border-2 border-background bg-connections-thread" /></span>
      <div className="mb-7 rounded-md bg-connections-wash px-4 py-3">
        <p className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-connections-thread">
          <ThemeDot theme={edge.theme} />
          {THEME_LABEL[edge.theme]}
          <span className="text-muted-foreground">· {edge.strength === "direct" ? "Named directly in Scripture" : "A biblical pattern or echo"}</span>
        </p>
        <p className="mt-1 font-connections-display text-lg italic text-foreground">{edge.label}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{edge.explanation}</p>
        {!!edge.support?.length && <div className="mt-2 flex flex-wrap gap-x-3">{edge.support.map((ref) => <PassageLink key={ref} refText={ref} />)}</div>}
      </div>
    </li>
  );
}

export function TraceJourney({ path, onOpenNode, onEdit, onGraph }: { path: PathStep[]; onOpenNode: (id: string) => void; onEdit: () => void; onGraph: () => void }) {
  const first = path[0]?.node;
  const last = path[path.length - 1]?.node;
  if (!first || !last) return null;
  return (
    <section aria-labelledby="trace-title" className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <header className="border-b border-connections-line pb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-connections-gold">Currently tracing</p>
        <h1 id="trace-title" className="mt-2 font-connections-display text-3xl leading-tight text-foreground sm:text-5xl">{first.label} to {last.label}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Follow the authored pathway one connection at a time. Each step explains what Scripture joins and why the relationship matters.</p>
      </header>
      <ol className="relative mt-9 space-y-3 before:absolute before:bottom-8 before:left-[1.34rem] before:top-8 before:w-px before:bg-connections-line">
        {path.flatMap((step, index) => {
          const items = [<Stop key={`node-${step.node.id}`} node={step.node} index={index} total={path.length} onOpen={onOpenNode} />];
          if (index < path.length - 1) {
            const nextEdge = path[index + 1]?.edge;
            if (nextEdge) items.push(<Bridge key={`edge-${nextEdge.from}-${nextEdge.to}-${index}`} edge={nextEdge} index={index} />);
          }
          return items;
        })}
      </ol>
      <footer className="mt-10 border-t border-connections-line pt-6">
        <Button onClick={onEdit} size="lg" className="min-h-12 w-full rounded-md">Trace another connection <ArrowRight /></Button>
        <Button onClick={onGraph} variant="outline" size="lg" className="mt-3 min-h-12 w-full rounded-md">View this pathway in the full graph</Button>
      </footer>
    </section>
  );
}