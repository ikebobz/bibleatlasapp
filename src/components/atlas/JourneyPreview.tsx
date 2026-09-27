import { LAKES, PLACES, RIVERS, SEAS, project } from "@/lib/atlas/geo";
import type { JourneyStop } from "@/lib/atlas/journeys";

const poly = (pts: [number, number][]) =>
  pts.map(([lon, lat]) => project(lon, lat).join(",")).join(" ");

/** Small static route sketch used on the /maps cards. */
export function JourneyPreview({ stops }: { stops: JourneyStop[] }) {
  const pts = stops
    .map((s) => PLACES[s.place])
    .filter(Boolean)
    .map((p) => project(p.lon, p.lat));
  if (pts.length === 0) return null;

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const pad = 40;
  // Tight routes (Jerusalem) would otherwise zoom to a meaningless blur.
  const minSpan = 150;
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  let w = Math.max(Math.max(...xs) - Math.min(...xs) + pad * 2, minSpan);
  let h = Math.max(Math.max(...ys) - Math.min(...ys) + pad * 2, minSpan / 2);
  const ratio = 16 / 9;
  if (w / h < ratio) w = h * ratio;
  else h = w / ratio;
  const x0 = cx - w / 2;
  const y0 = cy - h / 2;

  return (
    <svg
      viewBox={`${x0} ${y0} ${w} ${h}`}
      className="block h-full w-full bg-[var(--color-land)]"
      aria-hidden="true"
    >
      {SEAS.map((s) => (
        <polygon
          key={s.id}
          points={poly(s.points)}
          fill="var(--color-sea)"
          stroke="var(--color-land-edge)"
          strokeWidth={1}
        />
      ))}
      {RIVERS.map((r) => (
        <polyline
          key={r.id}
          points={poly(r.points)}
          fill="none"
          stroke="var(--color-sea)"
          strokeWidth={Math.max(1.5, w / 400)}
          strokeLinecap="round"
        />
      ))}
      {LAKES.map((l) => {
        const [lx, ly] = project(l.cx, l.cy);
        const [ax, ay] = project(l.cx - l.rx, l.cy - l.ry);
        return (
          <ellipse
            key={l.id}
            cx={lx}
            cy={ly}
            rx={Math.abs(lx - ax)}
            ry={Math.abs(ly - ay)}
            fill="var(--color-sea)"
          />
        );
      })}
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="var(--color-route)"
        strokeWidth={Math.max(2, w / 200)}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={Math.max(2.5, w / 220)} fill="var(--color-place)" />
      ))}
    </svg>
  );
}
