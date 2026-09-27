import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, RotateCw, Pause, Play } from "lucide-react";
import { ARTIFACT_BY_ID, type MaterialKey, type Part } from "@/lib/atlas/artifacts";

/** Illustrative material palette for the 3D viewer (not UI chrome). */
const MATERIAL: Record<MaterialKey, [number, number, number]> = {
  gold: [212, 168, 74],
  wood: [122, 88, 56],
  bronze: [150, 106, 62],
  silver: [176, 179, 184],
  linen: [232, 223, 203],
  crimson: [150, 58, 55],
  blue: [58, 84, 132],
  purple: [104, 66, 118],
  stone: [160, 152, 138],
  parchment: [216, 200, 168],
};

type V3 = [number, number, number];
type Face = { pts: V3[]; color: MaterialKey };

function boxFaces(pos: V3, size: V3): V3[][] {
  const [x, y, z] = pos;
  const [w, h, d] = size.map((s) => s / 2) as V3;
  const p = (dx: number, dy: number, dz: number): V3 => [x + dx * w, y + dy * h, z + dz * d];
  return [
    [p(-1, 1, -1), p(1, 1, -1), p(1, 1, 1), p(-1, 1, 1)], // top
    [p(-1, -1, -1), p(-1, -1, 1), p(1, -1, 1), p(1, -1, -1)], // bottom
    [p(-1, -1, 1), p(-1, 1, 1), p(1, 1, 1), p(1, -1, 1)], // front
    [p(1, -1, -1), p(1, 1, -1), p(-1, 1, -1), p(-1, -1, -1)], // back
    [p(1, -1, 1), p(1, 1, 1), p(1, 1, -1), p(1, -1, -1)], // right
    [p(-1, -1, -1), p(-1, 1, -1), p(-1, 1, 1), p(-1, -1, 1)], // left
  ];
}

function cylFaces(pos: V3, r: number, h: number, axis: "x" | "y" | "z", seg = 16): V3[][] {
  const ring = (t: number): V3[] =>
    Array.from({ length: seg }, (_, i) => {
      const a = (i / seg) * Math.PI * 2;
      const c = Math.cos(a) * r;
      const s = Math.sin(a) * r;
      if (axis === "y") return [pos[0] + c, pos[1] + t, pos[2] + s] as V3;
      if (axis === "x") return [pos[0] + t, pos[1] + c, pos[2] + s] as V3;
      return [pos[0] + c, pos[1] + s, pos[2] + t] as V3;
    });
  const a = ring(-h / 2);
  const b = ring(h / 2);
  const faces: V3[][] = [a, [...b].reverse()];
  for (let i = 0; i < seg; i++) {
    const j = (i + 1) % seg;
    faces.push([a[i], a[j], b[j], b[i]]);
  }
  return faces;
}

function buildFaces(parts: Part[]): Face[] {
  const out: Face[] = [];
  for (const part of parts) {
    const raw =
      part.kind === "box"
        ? boxFaces(part.pos, part.size)
        : cylFaces(part.pos, part.r, part.h, part.axis, part.seg);
    for (const pts of raw) out.push({ pts, color: part.color });
  }
  return out;
}

function rotate([x, y, z]: V3, yaw: number, pitch: number): V3 {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y1 = y * cp - z1 * sp;
  const z2 = y * sp + z1 * cp;
  return [x1, y1, z2];
}

function shade([r, g, b]: [number, number, number], light: number) {
  const f = (v: number) => Math.round(Math.min(255, Math.max(0, v * light)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

export function Artifact3D({ artifactId }: { artifactId: string }) {
  const artifact = ARTIFACT_BY_ID[artifactId];
  const faces = useMemo(() => (artifact ? buildFaces(artifact.parts) : []), [artifact]);

  const [yaw, setYaw] = useState(0.62);
  const [pitch, setPitch] = useState(0.34);
  const [spinning, setSpinning] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!spinning) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setYaw((v) => v + dt * 0.5);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spinning]);

  if (!artifact) return null;

  const s = 46 / artifact.scale;

  const projected = faces
    .map((f) => {
      const r = f.pts.map((p) => rotate(p, yaw, pitch));
      const depth = r.reduce((acc, p) => acc + p[2], 0) / r.length;
      // Face normal for flat shading.
      const [a, b, c] = r;
      const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const v: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const len = Math.hypot(n[0], n[1], n[2]) || 1;
      const ld = (n[0] * -0.35 + n[1] * 0.78 + n[2] * 0.52) / len;
      const light = 0.55 + 0.5 * Math.abs(ld);
      const d = r
        .map((p, i) => `${i === 0 ? "M" : "L"}${(p[0] * s).toFixed(2)},${(-p[1] * s).toFixed(2)}`)
        .join(" ");
      return { d: d + " Z", depth, fill: shade(MATERIAL[f.color], light) };
    })
    .sort((a, b) => a.depth - b.depth);

  const onDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setSpinning(false);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setYaw((v) => v + dx * 0.012);
    setPitch((v) => Math.max(-1.2, Math.min(1.2, v + dy * 0.01)));
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <svg
        viewBox="-50 -50 100 100"
        className="block h-56 w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="img"
        aria-label={`Rotatable 3D model of the ${artifact.title}`}
      >
        <defs>
          <radialGradient id={`bg-${artifact.id}`} cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="var(--color-surface-raised)" />
            <stop offset="100%" stopColor="var(--color-muted)" />
          </radialGradient>
        </defs>
        <rect x="-50" y="-50" width="100" height="100" fill={`url(#bg-${artifact.id})`} />
        <ellipse cx="0" cy="38" rx="30" ry="5" fill="var(--color-foreground)" opacity="0.07" />
        <g>
          {projected.map((f, i) => (
            <path key={i} d={f.d} fill={f.fill} stroke={f.fill} strokeWidth="0.25" />
          ))}
        </g>
      </svg>
      <div className="flex items-center justify-between border-t px-3 py-1.5">
        <p className="text-[11px] text-muted-foreground">Drag to rotate</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Rotate left"
            onClick={() => setYaw((v) => v - 0.4)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label={spinning ? "Stop rotation" : "Rotate continuously"}
            onClick={() => setSpinning((v) => !v)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted"
          >
            {spinning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
          <button
            type="button"
            aria-label="Rotate right"
            onClick={() => setYaw((v) => v + 0.4)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted"
          >
            <RotateCw className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
