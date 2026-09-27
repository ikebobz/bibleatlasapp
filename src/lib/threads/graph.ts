import { THREAD_EDGES, THREAD_NODES, WALKTHROUGHS } from "./data";
import type { ThreadEdge, ThreadNode, ThreadTheme, Walkthrough } from "./types";

export { THREAD_EDGES, THREAD_NODES, WALKTHROUGHS };
export type { ThreadEdge, ThreadNode, Walkthrough };

export const NODE_BY_ID: Record<string, ThreadNode> = Object.fromEntries(
  THREAD_NODES.map((n) => [n.id, n]),
);

/** Atlas entry id → thread node, so a context panel can find its threads. */
export const NODE_BY_ENTRY: Record<string, ThreadNode> = Object.fromEntries(
  THREAD_NODES.filter((n) => n.entry).map((n) => [n.entry!, n]),
);

export type Neighbour = { edge: ThreadEdge; node: ThreadNode; direction: "out" | "in" };

const adjacency = new Map<string, Neighbour[]>();
for (const edge of THREAD_EDGES) {
  const from = NODE_BY_ID[edge.from];
  const to = NODE_BY_ID[edge.to];
  if (!from || !to) continue;
  if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
  if (!adjacency.has(edge.to)) adjacency.set(edge.to, []);
  adjacency.get(edge.from)!.push({ edge, node: to, direction: "out" });
  adjacency.get(edge.to)!.push({ edge, node: from, direction: "in" });
}

export function neighbours(id: string): Neighbour[] {
  return adjacency.get(id) ?? [];
}

export function connectionCount(id: string) {
  return neighbours(id).length;
}

/** "Genesis 12" → "genesis|12". Books outside the reader library still index fine. */
function chapterKeyFromRef(ref: string): string | null {
  const m = ref.trim().match(/^((?:[1-3]\s)?[A-Za-z ]+?)\s+(\d+)/);
  if (!m) return null;
  return `${m[1].trim().toLowerCase().replace(/\s+/g, "-")}|${Number(m[2])}`;
}

const byChapter = new Map<string, ThreadNode[]>();
for (const node of THREAD_NODES) {
  for (const ref of [node.ref, ...(node.alsoIn ?? [])]) {
    const key = chapterKeyFromRef(ref);
    if (!key) continue;
    if (!byChapter.has(key)) byChapter.set(key, []);
    const list = byChapter.get(key)!;
    if (!list.includes(node)) list.push(node);
  }
}

/** Thread nodes anchored in a chapter the reader is currently in. */
export function nodesInChapter(book: string, chapter: number): ThreadNode[] {
  return byChapter.get(`${book.toLowerCase()}|${chapter}`) ?? [];
}

export function themesOf(node: ThreadNode): ThreadTheme[] {
  return node.themes;
}

/** Shortest path between two nodes, returned as an ordered list of hops. */
export function tracePath(
  fromId: string,
  toId: string,
  themes?: ThreadTheme[],
): { node: ThreadNode; edge?: ThreadEdge }[] | null {
  if (fromId === toId) {
    const n = NODE_BY_ID[fromId];
    return n ? [{ node: n }] : null;
  }
  const allowed = themes && themes.length ? new Set(themes) : null;
  const prev = new Map<string, { id: string; edge: ThreadEdge }>();
  const seen = new Set([fromId]);
  const queue = [fromId];

  while (queue.length) {
    const current = queue.shift()!;
    for (const { edge, node } of neighbours(current)) {
      if (allowed && !allowed.has(edge.theme)) continue;
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      prev.set(node.id, { id: current, edge });
      if (node.id === toId) {
        const path: { node: ThreadNode; edge?: ThreadEdge }[] = [];
        let cursor = toId;
        while (cursor !== fromId) {
          const step = prev.get(cursor)!;
          path.unshift({ node: NODE_BY_ID[cursor], edge: step.edge });
          cursor = step.id;
        }
        path.unshift({ node: NODE_BY_ID[fromId] });
        return path;
      }
      queue.push(node.id);
    }
  }
  return null;
}

export function searchNodes(query: string, limit = 8): ThreadNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return THREAD_NODES.filter(
    (n) =>
      n.label.toLowerCase().includes(q) ||
      n.ref.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q),
  ).slice(0, limit);
}
