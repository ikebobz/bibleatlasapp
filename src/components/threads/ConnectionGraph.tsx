import { useEffect, useMemo, useRef, useState } from "react";
import type { ThreadEdge, ThreadNode, ThreadTheme } from "@/lib/threads/types";
import { themeColor } from "@/lib/threads/types";

type Pos = { x: number; y: number; vx: number; vy: number; pinned?: boolean };

const W = 1200;
const H = 820;

function labelWidth(label: string) {
  return Math.min(220, label.length * 6.4 + 22);
}

function initialPositions(nodes: ThreadNode[]): Record<string, Pos> {
  const out: Record<string, Pos> = {};
  nodes.forEach((n, i) => {
    const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    const side = n.testament === "old" ? -1 : 1;
    out[n.id] = {
      x: W / 2 + side * 210 + Math.cos(angle) * 240,
      y: H / 2 + Math.sin(angle) * 260,
      vx: 0,
      vy: 0,
    };
  });
  return out;
}

export function ConnectionGraph({
  nodes,
  edges,
  activeThemes,
  selectedId,
  pathIds,
  pathEdgeKeys,
  onSelect,
}: {
  nodes: ThreadNode[];
  edges: ThreadEdge[];
  activeThemes: Set<ThreadTheme>;
  selectedId?: string;
  pathIds?: Set<string>;
  pathEdgeKeys?: Set<string>;
  onSelect: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const posRef = useRef<Record<string, Pos>>(initialPositions(nodes));
  const [, forceRender] = useState(0);
  const [view, setView] = useState({ k: 1, tx: 0, ty: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dragRef = useRef<{ id: string | null; panning: boolean; lastX: number; lastY: number }>({
    id: null,
    panning: false,
    lastX: 0,
    lastY: 0,
  });

  const neighbourIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!map.has(e.from)) map.set(e.from, new Set());
      if (!map.has(e.to)) map.set(e.to, new Set());
      map.get(e.from)!.add(e.to);
      map.get(e.to)!.add(e.from);
    }
    return map;
  }, [edges]);

  /* Force simulation: runs on mount and settles. */
  useEffect(() => {
    const pos = posRef.current;
    for (const n of nodes) if (!pos[n.id]) pos[n.id] = initialPositions([n])[n.id];

    let alpha = 1;
    let frame = 0;
    let raf = 0;

    const tick = () => {
      for (let iter = 0; iter < 2; iter++) {
        // repulsion
        for (let i = 0; i < nodes.length; i++) {
          const a = pos[nodes[i].id];
          for (let j = i + 1; j < nodes.length; j++) {
            const b = pos[nodes[j].id];
            let dx = b.x - a.x;
            let dy = (b.y - a.y) * 1.6;
            let d2 = dx * dx + dy * dy;
            if (d2 < 1) {
              dx = (i - j) * 0.5 + 0.7;
              dy = 0.7;
              d2 = 1;
            }
            const force = (16000 * alpha) / d2;
            const d = Math.sqrt(d2);
            const fx = (dx / d) * force;
            const fy = (dy / d) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }
        // springs
        for (const e of edges) {
          const a = pos[e.from];
          const b = pos[e.to];
          if (!a || !b) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.max(1, Math.hypot(dx, dy));
          const target = e.strength === "direct" ? 170 : 220;
          const force = ((d - target) / d) * 0.04 * alpha;
          a.vx += dx * force;
          a.vy += dy * force;
          b.vx -= dx * force;
          b.vy -= dy * force;
        }
        // testament anchoring + gravity
        for (const n of nodes) {
          const p = pos[n.id];
          const anchorX = n.testament === "old" ? W * 0.27 : W * 0.73;
          p.vx += (anchorX - p.x) * 0.03 * alpha;
          p.vy += (H / 2 - p.y) * 0.012 * alpha;
        }
        for (const n of nodes) {
          const p = pos[n.id];
          if (p.pinned) {
            p.vx = 0;
            p.vy = 0;
            continue;
          }
          p.vx *= 0.82;
          p.vy *= 0.82;
          p.x = Math.max(60, Math.min(W - 60, p.x + p.vx));
          p.y = Math.max(40, Math.min(H - 40, p.y + p.vy));
        }
        // label collision: keep the pills from overlapping
        for (let i = 0; i < nodes.length; i++) {
          const a = pos[nodes[i].id];
          const aw = labelWidth(nodes[i].label) / 2 + 6;
          for (let j = i + 1; j < nodes.length; j++) {
            const b = pos[nodes[j].id];
            const bw = labelWidth(nodes[j].label) / 2 + 6;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const ox = aw + bw - Math.abs(dx);
            const oy = 32 - Math.abs(dy);
            if (ox > 0 && oy > 0) {
              if (ox / (aw + bw) < oy / 32) {
                const shift = (ox / 2) * (dx < 0 ? -1 : 1);
                if (!a.pinned) a.x -= shift;
                if (!b.pinned) b.x += shift;
              } else {
                const shift = (oy / 2) * (dy < 0 ? -1 : 1);
                if (!a.pinned) a.y -= shift;
                if (!b.pinned) b.y += shift;
              }
            }
          }
        }
      }
      alpha *= 0.982;
      frame++;
      forceRender((v) => v + 1);
      if (frame < 400 && alpha > 0.015) raf = requestAnimationFrame(tick);
      else fitToView();
    };

    const fitToView = () => {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const n of nodes) {
        const p = pos[n.id];
        if (!p) continue;
        xs.push(p.x - labelWidth(n.label) / 2, p.x + labelWidth(n.label) / 2);
        ys.push(p.y - 20, p.y + 20);
      }
      if (!xs.length) return;
      const minX = Math.min(...xs) - 30;
      const maxX = Math.max(...xs) + 30;
      const minY = Math.min(...ys) - 50;
      const maxY = Math.max(...ys) + 30;
      const k = Math.min(W / (maxX - minX), H / (maxY - minY), 1.4);
      setView({
        k,
        tx: (W - (maxX - minX) * k) / 2 - minX * k,
        ty: (H - (maxY - minY) * k) / 2 - minY * k,
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodes, edges]);

  /* Wheel zoom (non-passive so it can prevent page scroll). */
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      setView((v) => {
        const k = Math.max(0.4, Math.min(3.5, v.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
        const scale = k / v.k;
        return { k, tx: mx - (mx - v.tx) * scale, ty: my - (my - v.ty) * scale };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const toGraph = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = (clientX - rect.left) * (W / rect.width);
    const sy = (clientY - rect.top) * (H / rect.height);
    return { x: (sx - view.tx) / view.k, y: (sy - view.ty) / view.k };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag.id) {
      const p = toGraph(e.clientX, e.clientY);
      const node = posRef.current[drag.id];
      node.x = p.x;
      node.y = p.y;
      node.pinned = true;
      forceRender((v) => v + 1);
    } else if (drag.panning) {
      const dx = e.clientX - drag.lastX;
      const dy = e.clientY - drag.lastY;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
    }
  };

  const endDrag = () => {
    dragRef.current.id = null;
    dragRef.current.panning = false;
  };

  const dim = (nodeId: string) => {
    if (pathIds && pathIds.size) return !pathIds.has(nodeId);
    const focus = hover ?? selectedId;
    if (!focus) return false;
    return focus !== nodeId && !neighbourIds.get(focus)?.has(nodeId);
  };

  const pos = posRef.current;

  // The layout is computed by a physics simulation, so it can't match server HTML.
  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-xs text-muted-foreground">Drawing the threads…</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={(e) => {
          dragRef.current.panning = true;
          dragRef.current.lastX = e.clientX;
          dragRef.current.lastY = e.clientY;
        }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        role="application"
        aria-label="Scripture connection graph"
      >
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>
          {/* testament fields */}
          <text x={W * 0.3} y={30} textAnchor="middle" className="fill-muted-foreground text-[13px] uppercase tracking-[0.3em]">
            Old Testament
          </text>
          <text x={W * 0.7} y={30} textAnchor="middle" className="fill-muted-foreground text-[13px] uppercase tracking-[0.3em]">
            New Testament
          </text>
          <line x1={W / 2} y1={44} x2={W / 2} y2={H - 20} className="stroke-border" strokeDasharray="2 10" />

          {edges.map((e) => {
            const a = pos[e.from];
            const b = pos[e.to];
            if (!a || !b) return null;
            const key = `${e.from}->${e.to}`;
            const onPath = pathEdgeKeys?.has(key);
            const themeOn = activeThemes.size === 0 || activeThemes.has(e.theme);
            const faded = (!themeOn || dim(e.from) || dim(e.to)) && !onPath;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - Math.hypot(b.x - a.x, b.y - a.y) * 0.11;
            return (
              <path
                key={key + e.theme}
                d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                fill="none"
                stroke={themeColor(e.theme)}
                strokeWidth={onPath ? 3 : e.strength === "direct" ? 1.6 : 1.2}
                strokeDasharray={e.strength === "indirect" ? "4 5" : undefined}
                opacity={onPath ? 0.95 : faded ? 0.07 : 0.42}
                style={{ transition: "opacity 200ms ease" }}
              />
            );
          })}

          {nodes.map((n) => {
            const p = pos[n.id];
            if (!p) return null;
            const themeOn = activeThemes.size === 0 || n.themes.some((t) => activeThemes.has(t));
            const onPath = pathIds?.has(n.id);
            const faded = (!themeOn || dim(n.id)) && !onPath;
            const w = labelWidth(n.label);
            const active = selectedId === n.id;
            const colour = themeColor(n.themes[0]);
            return (
              <g
                key={n.id}
                transform={`translate(${p.x} ${p.y})`}
                opacity={faded ? 0.16 : 1}
                style={{ transition: "opacity 200ms ease", cursor: "pointer" }}
                role="button"
                tabIndex={0}
                aria-label={`${n.label}, ${n.ref}, ${n.kind}, ${n.testament === "old" ? "Old Testament" : "New Testament"}`}
                onFocus={() => setHover(n.id)}
                onBlur={() => setHover((current) => (current === n.id ? null : current))}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  onSelect(n.id);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  dragRef.current.id = n.id;
                  dragRef.current.panning = false;
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  if (dragRef.current.id === n.id) onSelect(n.id);
                  endDrag();
                }}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
              >
                <rect
                  x={-w / 2}
                  y={-13}
                  width={w}
                  height={26}
                  rx={13}
                  fill="var(--color-surface-raised)"
                  stroke={active || onPath ? colour : "var(--color-border)"}
                  strokeWidth={active || onPath ? 2 : 1}
                  style={{ filter: active || hover === n.id ? "drop-shadow(0 4px 10px color-mix(in oklab, var(--color-foreground) 18%, transparent))" : undefined }}
                />
                <circle cx={-w / 2 + 10} cy={0} r={3.2} fill={colour} />
                <text
                  x={6 - w / 2 + 10}
                  y={4}
                  className="fill-foreground"
                  style={{ fontSize: 11.5, fontWeight: active ? 600 : 500 }}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="pointer-events-auto absolute bottom-3 right-3 flex flex-col gap-1 rounded-xl border bg-surface-raised/90 p-1 shadow-sm backdrop-blur">
        {[
          { label: "+", action: () => setView((v) => ({ ...v, k: Math.min(3.5, v.k * 1.2) })) },
          { label: "−", action: () => setView((v) => ({ ...v, k: Math.max(0.4, v.k / 1.2) })) },
          { label: "⟳", action: () => setView({ k: 1, tx: 0, ty: 0 }) },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={b.action}
            className="h-7 w-7 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={b.label === "⟳" ? "Reset view" : b.label === "+" ? "Zoom in" : "Zoom out"}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}
