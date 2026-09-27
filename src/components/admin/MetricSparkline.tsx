/** Tiny dependency-free line chart for admin metric history. */
export type SparkPoint = { label: string; value: number | null };

export function MetricSparkline({
  points,
  height = 72,
  ariaLabel,
}: {
  points: SparkPoint[];
  height?: number;
  ariaLabel: string;
}) {
  const usable = points.filter((p) => p.value !== null) as { label: string; value: number }[];

  if (usable.length < 2) {
    return (
      <p className="mt-3 text-xs text-muted-foreground">
        Not enough history yet — a point is stored each day you open this page.
      </p>
    );
  }

  const width = 320;
  const max = Math.max(...usable.map((p) => p.value));
  const min = Math.min(...usable.map((p) => p.value));
  const span = max - min || 1;
  const step = width / (usable.length - 1);

  const coords = usable.map((point, i) => {
    const x = i * step;
    const y = height - ((point.value - min) / span) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = `M${coords.join(" L")}`;
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="mt-3 h-[72px] w-full text-primary"
    >
      <path d={area} fill="currentColor" opacity={0.12} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
