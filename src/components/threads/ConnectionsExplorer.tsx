import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, Filter, Network, Route as RouteIcon, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConnectionGraph } from "./ConnectionGraph";
import { ConnectionPicker } from "./ConnectionPicker";
import { NodeDetail } from "./NodeDetail";
import { TraceJourney } from "./TraceJourney";
import { WalkthroughList, WalkthroughView } from "./Walkthroughs";
import { ThemeDot } from "./ConnectionList";
import { NODE_BY_ID, THREAD_EDGES, THREAD_NODES, tracePath } from "@/lib/threads/graph";
import { connectionReturn } from "@/lib/threads/return-context";
import { THEMES, type ThreadTheme } from "@/lib/threads/types";

type ExplorerMode = "home" | "trace" | "graph" | "node" | "walkthrough";

export type ConnectionsSearch = {
  from?: string;
  start?: string;
  end?: string;
  view?: "trace" | "graph";
};

export function parseConnectionsSearch(raw: Record<string, unknown>): ConnectionsSearch {
  const node = (value: unknown) => typeof value === "string" && NODE_BY_ID[value] ? value : undefined;
  return {
    from: typeof raw.from === "string" ? raw.from : undefined,
    start: node(raw.start),
    end: node(raw.end),
    view: raw.view === "trace" || raw.view === "graph" ? raw.view : undefined,
  };
}

export function ConnectionsExplorer({ focusId, search = {} }: { focusId?: string; search?: ConnectionsSearch }) {
  const navigate = useNavigate();
  const initialPath = search.start && search.end ? tracePath(search.start, search.end) : null;
  const [mode, setMode] = useState<ExplorerMode>(search.view === "graph" ? "graph" : initialPath ? "trace" : focusId ? "node" : "home");
  const [selected, setSelected] = useState<string | undefined>(focusId);
  const [start, setStart] = useState(search.start ? NODE_BY_ID[search.start] : focusId ? NODE_BY_ID[focusId] : undefined);
  const [end, setEnd] = useState(search.end ? NODE_BY_ID[search.end] : undefined);
  const [themes, setThemes] = useState<Set<ThreadTheme>>(new Set());
  const [walkthrough, setWalkthrough] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const path = useMemo(() => (start && end ? tracePath(start.id, end.id) : null), [end, start]);
  const pathIds = useMemo(() => new Set((path ?? []).map((step) => step.node.id)), [path]);
  const pathEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const step of path ?? []) if (step.edge) keys.add(`${step.edge.from}->${step.edge.to}`);
    return keys;
  }, [path]);
  const returnTo = connectionReturn(search.from);

  const updateAddress = (next: ConnectionsSearch) => {
    const destination = selected ? "/connections/$node" : "/connections";
    navigate({
      to: destination,
      ...(selected ? { params: { node: selected } } : {}),
      search: { ...next, from: search.from },
      resetScroll: false,
    });
  };

  const openNode = (id: string) => {
    setSelected(id);
    setMode("node");
    setWalkthrough(null);
    navigate({ to: "/connections/$node", params: { node: id }, search: { ...search, start: start?.id, end: end?.id }, resetScroll: false });
  };

  const beginTrace = (id?: string) => {
    const nextStart = id ? NODE_BY_ID[id] : start;
    setStart(nextStart);
    setEnd(undefined);
    setMode("trace");
    setSelected(undefined);
    navigate({ to: "/connections", search: { from: search.from, start: nextStart?.id, view: "trace" }, resetScroll: false });
  };

  const chooseDestination = (node: typeof end) => {
    setEnd(node);
    if (start && node) {
      navigate({ to: "/connections", search: { from: search.from, start: start.id, end: node.id, view: "trace" }, resetScroll: false });
    }
  };

  const revealTrace = () => {
    if (!start || !end) return;
    setMode("trace");
    updateAddress({ start: start.id, end: end.id, view: "trace" });
  };

  return (
    <div className="min-h-screen bg-background font-connections-body text-foreground">
      <header className="sticky top-0 z-30 border-b border-connections-line bg-background/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          {returnTo ? (
            <a href={returnTo.href} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Back to {returnTo.label}</span><span className="sm:hidden">{returnTo.label}</span>
            </a>
          ) : (
            <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-connections-gold" aria-hidden /> Bible Atlas
            </Link>
          )}
          <span className="hidden h-4 w-px bg-connections-line sm:block" />
          <button type="button" onClick={() => { setMode("home"); setSelected(undefined); navigate({ to: "/connections", search: { from: search.from }, resetScroll: false }); }} className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">Connections</button>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setMode("home")} aria-label="Search connections" title="Search connections"><Search /></Button>
            <Button variant="ghost" size="icon" onClick={() => setFiltersOpen((open) => !open)} aria-label="Filter themes" title="Filter themes"><Filter /></Button>
            <Button variant={mode === "graph" ? "secondary" : "ghost"} size="icon" onClick={() => { setMode("graph"); updateAddress({ start: start?.id, end: end?.id, view: "graph" }); }} aria-label="Explore full graph" title="Explore full graph"><Network /></Button>
          </div>
        </div>
        {filtersOpen && (
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto border-t border-connections-line px-4 py-2 sm:px-6">
            {THEMES.map((theme) => {
              const active = themes.has(theme.id);
              return <button key={theme.id} type="button" onClick={() => setThemes((current) => { const next = new Set(current); active ? next.delete(theme.id) : next.add(theme.id); return next; })} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3 text-xs ${active ? "bg-connections-wash text-foreground" : "text-muted-foreground hover:bg-muted"}`}><ThemeDot theme={theme.id} />{theme.label}</button>;
            })}
            {themes.size > 0 && <button type="button" onClick={() => setThemes(new Set())} className="inline-flex min-h-11 shrink-0 items-center gap-1 px-2 text-xs text-muted-foreground"><X className="h-3.5 w-3.5" /> Clear</button>}
          </div>
        )}
      </header>

      {mode === "home" && (
        <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
          <section className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-connections-gold">Connections across Scripture</p>
            <h1 className="mt-3 font-connections-display text-4xl leading-[1.08] text-foreground sm:text-6xl">Follow the thread. See why it matters.</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Scripture returns to the same promises, symbols and events across centuries. Trace two moments to see the authored pathway between them, one meaningful step at a time.</p>
            <Button size="lg" onClick={() => beginTrace()} className="mt-7 min-h-12 rounded-md px-6"><RouteIcon /> Trace a connection</Button>
          </section>

          <section className="mt-16 border-y border-connections-line py-9" aria-labelledby="featured-thread">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-connections-thread">A connection to begin with</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
              <div><h2 id="featured-thread" className="font-connections-display text-2xl">The Passover lamb</h2><p className="scripture mt-1 text-sm text-muted-foreground">Exodus 12</p></div>
              <ArrowRight className="hidden h-5 w-5 text-connections-gold sm:block" aria-hidden />
              <div><h2 className="font-connections-display text-2xl">Christ our Passover</h2><p className="scripture mt-1 text-sm text-muted-foreground">1 Corinthians 5:7</p></div>
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-foreground/85">A lamb without blemish marks a household for deliverance; the New Testament names that rescue pattern directly in Christ.</p>
            <button type="button" onClick={() => { const featuredStart = NODE_BY_ID["passover"]; const featuredEnd = NODE_BY_ID["christ-our-passover"]; setStart(featuredStart); setEnd(featuredEnd); setMode("trace"); navigate({ to: "/connections", search: { from: search.from, start: featuredStart.id, end: featuredEnd.id, view: "trace" }, resetScroll: false }); }} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-connections-gold hover:text-foreground">Reveal this thread <ArrowRight className="h-4 w-4" /></button>
          </section>

          <section className="mt-14" aria-labelledby="guided-heading">
            <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Curated journeys</p><h2 id="guided-heading" className="mt-1 font-connections-display text-3xl">Follow a thread</h2></div><button type="button" onClick={() => setMode("graph")} className="min-h-11 text-xs font-semibold text-muted-foreground hover:text-foreground">Explore all {THREAD_NODES.length} moments</button></div>
            <div className="mt-5"><WalkthroughList onOpen={(id) => { setWalkthrough(id); setMode("walkthrough"); }} /></div>
          </section>
        </main>
      )}

      {mode === "trace" && !path && (
        <main className="mx-auto max-w-2xl px-5 py-10 sm:px-8 sm:py-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-connections-gold">Trace a connection</p>
          <h1 className="mt-2 font-connections-display text-4xl leading-tight">Choose two moments in Scripture.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">We’ll find the clearest authored path between them and explain every step.</p>
          <div className="mt-8 border-t border-connections-line">
            <ConnectionPicker label="Start" value={start} excludeId={end?.id} onSelect={setStart} />
            <ConnectionPicker label="Destination" value={end} excludeId={start?.id} onSelect={chooseDestination} />
          </div>
          {start && end && !tracePath(start.id, end.id) && <p className="mt-5 rounded-md bg-muted p-4 text-sm text-muted-foreground">No authored pathway joins these moments yet. Try a different destination.</p>}
          <Button size="lg" onClick={revealTrace} disabled={!start || !end || !tracePath(start.id, end.id)} className="mt-7 min-h-12 w-full rounded-md">Reveal the connection <ArrowRight /></Button>
          <Button variant="ghost" size="lg" onClick={() => setMode("home")} className="mt-2 min-h-12 w-full">Cancel</Button>
        </main>
      )}

      {mode === "trace" && path && <TraceJourney path={path} onOpenNode={openNode} onEdit={() => { setEnd(undefined); setMode("trace"); navigate({ to: "/connections", search: { from: search.from, start: start?.id, view: "trace" }, resetScroll: false }); }} onGraph={() => { setMode("graph"); updateAddress({ start: start?.id, end: end?.id, view: "graph" }); }} />}

      {mode === "node" && selected && NODE_BY_ID[selected] && (
        <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
          <button type="button" onClick={() => setMode(path ? "trace" : "home")} className="mb-7 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> {path ? "Back to trace" : "All connections"}</button>
          <NodeDetail node={NODE_BY_ID[selected]} activeThemes={themes} onSelectNode={openNode} onTraceFrom={beginTrace} />
        </main>
      )}

      {mode === "walkthrough" && walkthrough && <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12"><WalkthroughView id={walkthrough} onClose={() => setMode("home")} onSelectNode={openNode} returnHref={returnTo?.href} returnLabel={returnTo?.label} /></main>}

      {mode === "graph" && (
        <main className="flex min-h-[calc(100vh-4rem)] flex-col">
          <div className="mx-auto flex w-full max-w-6xl items-end justify-between gap-4 px-5 py-6 sm:px-8">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-connections-thread">Optional overview</p><h1 className="mt-1 font-connections-display text-3xl">The full connection graph</h1><p className="mt-1 text-sm text-muted-foreground">Select a moment to read its meaning, or return to the guided Trace.</p></div>
            <Button variant="outline" onClick={() => beginTrace(start?.id)} className="min-h-11 shrink-0"><RouteIcon /> <span className="hidden sm:inline">Guided Trace</span><span className="sm:hidden">Trace</span></Button>
          </div>
          <div className="min-h-[34rem] flex-1 border-y border-connections-line">
            <ConnectionGraph nodes={THREAD_NODES} edges={THREAD_EDGES} activeThemes={themes} selectedId={selected} pathIds={pathIds} pathEdgeKeys={pathEdgeKeys} onSelect={openNode} />
          </div>
        </main>
      )}
    </div>
  );
}