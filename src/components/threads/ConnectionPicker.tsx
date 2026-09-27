import { Search, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { searchNodes, THREAD_NODES, type ThreadNode } from "@/lib/threads/graph";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";

export function ConnectionPicker({
  label,
  value,
  excludeId,
  onSelect,
}: {
  label: string;
  value?: ThreadNode;
  excludeId?: string;
  onSelect: (node: ThreadNode | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => {
    const list = query.trim() ? searchNodes(query, 12) : THREAD_NODES.slice(0, 12);
    return list.filter((node) => node.id !== excludeId);
  }, [excludeId, query]);

  useDismissibleLayer({
    refs: [rootRef],
    onDismiss: () => setOpen(false),
    enabled: open,
  });

  if (value) {
    return (
      <div className="flex min-h-16 items-center gap-3 border-b border-connections-line py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-connections-thread bg-background text-xs font-semibold text-connections-thread">
          {value.kind.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
          <span className="block truncate font-connections-display text-lg text-foreground">{value.label}</span>
          <span className="scripture block text-xs text-muted-foreground">{value.ref}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            onSelect(undefined);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="inline-flex min-h-11 items-center px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative border-b border-connections-line py-3">
      <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground" htmlFor={`connection-${label}`}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          id={`connection-${label}`}
          type="search"
          value={query}
          placeholder="Search a person, event, symbol or passage"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={`connection-results-${label}`}
          aria-activedescendant={open && results[active] ? `${label}-${results[active].id}` : undefined}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActive((index) => Math.min(index + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && open && results[active]) {
              event.preventDefault();
              onSelect(results[active]);
              setQuery("");
              setOpen(false);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-12 w-full rounded-md border bg-surface-raised pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-connections-thread focus:ring-1 focus:ring-connections-thread"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <ul id={`connection-results-${label}`} role="listbox" className="absolute inset-x-0 top-full z-40 max-h-72 overflow-y-auto rounded-b-md border border-t-0 bg-popover p-1 shadow-xl">
          {results.length ? results.map((node, index) => (
            <li key={node.id} id={`${label}-${node.id}`} role="option" aria-selected={index === active}>
              <button
                type="button"
                onPointerMove={() => setActive(index)}
                onClick={() => {
                  onSelect(node);
                  setQuery("");
                  setOpen(false);
                }}
                className={`flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${index === active ? "bg-muted" : "hover:bg-muted"}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold uppercase text-muted-foreground">{node.kind.slice(0, 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{node.label}</span>
                  <span className="scripture block text-xs text-muted-foreground">{node.ref} · {node.testament === "old" ? "Old Testament" : "New Testament"}</span>
                </span>
              </button>
            </li>
          )) : (
            <li className="px-3 py-4 text-sm text-muted-foreground">No authored connection matches “{query}”.</li>
          )}
        </ul>
      )}
    </div>
  );
}