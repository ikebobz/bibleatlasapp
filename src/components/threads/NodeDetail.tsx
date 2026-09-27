import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { ConnectionList, PassageLink, ThemeDot } from "./ConnectionList";
import { neighbours, type ThreadNode } from "@/lib/threads/graph";
import { THEME_LABEL, type ThreadTheme } from "@/lib/threads/types";
import { getThreadInsight } from "@/lib/threads/ai.functions";
import { insightKey, readCachedInsight, writeCachedInsight } from "@/lib/threads/insight-cache";
import { StateMessage } from "@/components/ui/state-message";

function AiInsight({ node }: { node: ThreadNode }) {
  const fetchInsight = useServerFn(getThreadInsight);
  const known = neighbours(node.id).map((n) => n.node.label);
  const cacheKey = insightKey(node.id);
  const cached = useMemo(() => readCachedInsight(cacheKey), [cacheKey]);
  const { data, isPending, error } = useQuery({
    queryKey: ["thread-insight", node.id],
    queryFn: async () => {
      const local = readCachedInsight(cacheKey);
      if (local) return local;
      const result = await fetchInsight({
        data: { label: node.label, reference: node.ref, summary: node.summary, known },
      });
      writeCachedInsight(cacheKey, result);
      return result;
    },
    initialData: cached,
    staleTime: Infinity,
    retry: 1,
  });

  if (isPending)
    return <StateMessage kind="loading" title="Tracing further connections…" compact />;

  if (error || !data)
    return <StateMessage kind="error" title="Further connections could not be generated right now" description="The curated connections above remain available." compact />;

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-xl border border-dashed bg-muted/40 p-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Generated connections — beyond the curated graph. Check them against the passages themselves.
        </p>
      </div>
      {data.paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-foreground/90">
          {p}
        </p>
      ))}
      {data.links.length > 0 && (
        <ul className="space-y-1.5">
          {data.links.map((l) => (
            <li key={l.ref + l.note} className="rounded-lg border bg-card px-3 py-2">
              <PassageLink refText={l.ref} className="!text-foreground" />
              {l.note && <p className="mt-0.5 text-xs text-muted-foreground">{l.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function NodeDetail({
  node,
  activeThemes,
  onSelectNode,
  onTraceFrom,
}: {
  node: ThreadNode;
  activeThemes?: Set<ThreadTheme>;
  onSelectNode?: (id: string) => void;
  onTraceFrom?: (id: string) => void;
}) {
  const [showAi, setShowAi] = useState(false);
  const count = neighbours(node.id).length;

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          {node.kind} · {node.testament === "old" ? "Old Testament" : "New Testament"}
        </p>
        <h1 className="scripture text-2xl leading-tight text-foreground">{node.label}</h1>
        <PassageLink refText={node.ref} />
        <p className="pt-1 text-sm leading-relaxed text-foreground/90">{node.summary}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {node.themes.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              <ThemeDot theme={t} />
              {THEME_LABEL[t]}
            </span>
          ))}
        </div>
      </header>

      {onTraceFrom && (
        <button
          type="button"
          onClick={() => onTraceFrom(node.id)}
          className="min-h-11 w-full rounded-lg border border-dashed py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Trace a pathway from here
        </button>
      )}

      <div>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {count} connection{count === 1 ? "" : "s"}
        </h2>
        <ConnectionList nodeId={node.id} activeThemes={activeThemes} onSelectNode={onSelectNode} />
      </div>

      <div className="border-t pt-4">
        {showAi ? (
          <AiInsight node={node} />
        ) : (
          <button
            type="button"
            onClick={() => setShowAi(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Find further connections
          </button>
        )}
      </div>
    </div>
  );
}
