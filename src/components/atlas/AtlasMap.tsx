import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import {
  Globe2,
  Layers3,
  Minus,
  Mountain,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BOUNDS,
  LAKES,
  MODERN_BORDERS,
  MODERN_NAMES,
  PLACES,
  RIVERS,
  SEAS,
  VIEW,
  haversineKm,
  project,
} from "@/lib/atlas/geo";
import type { RouteStop } from "@/lib/atlas/types";
import type { JourneyComparisonRoute } from "@/lib/atlas/journeys";
import { ATLAS_LAND } from "@/lib/atlas/land";
import { pointAlongPath, routePath, segmentDistanceKm } from "@/lib/atlas/corridors";
import { cn } from "@/lib/utils";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";

export type MapLayers = {
  places?: boolean;
  water?: boolean;
  modern?: boolean;
  terrain?: boolean;
};

type Props = {
  focus?: string[];
  route?: { name: string; stops: RouteStop[] };
  compare?: JourneyComparisonRoute[];
  interactive?: boolean;
  selectedStop?: number | null;
  onActiveStopChange?: (index: number) => void;
  navigation?: boolean;
  placeIds?: string[];
  selectedPlace?: string | null;
  onPlaceSelect?: (placeId: string) => void;
  layers?: MapLayers;
  onLayersChange?: (layers: MapLayers) => void;
  showLayerControl?: boolean;
  controls?: boolean;
  routeControls?: boolean;
  navigationControlsClassName?: string;
  layerControlsClassName?: string;
  cinematic?: boolean;
  richAtlas?: boolean;
  className?: string;
};

const poly = (pts: [number, number][]) => pts.map(([lon, lat]) => project(lon, lat).join(",")).join(" ");

const TERRAIN_MASSES = [
  { id: "levant-ridge", center: [35.45, 32.25] as [number, number], rx: 34, ry: 150, rotate: -8 },
  { id: "judean-hills", center: [35.2, 31.72] as [number, number], rx: 29, ry: 88, rotate: -5 },
  { id: "transjordan", center: [36.2, 31.7] as [number, number], rx: 38, ry: 145, rotate: -10 },
  { id: "sinai", center: [33.75, 29.05] as [number, number], rx: 76, ry: 72, rotate: -18 },
  { id: "taurus", center: [35.1, 38.3] as [number, number], rx: 150, ry: 54, rotate: -4 },
  { id: "zagros", center: [45.1, 34.3] as [number, number], rx: 105, ry: 190, rotate: -18 },
  { id: "anatolia", center: [29.5, 39.2] as [number, number], rx: 160, ry: 66, rotate: 3 },
];

const RIDGES: Array<{ id: string; points: [number, number][] }> = [
  { id: "central-ridge", points: [[35.15, 33.15], [35.22, 32.75], [35.2, 32.2], [35.2, 31.75], [35.05, 31.25], [34.95, 30.7]] },
  { id: "east-ridge", points: [[36.05, 33.3], [36.1, 32.75], [35.92, 32.2], [35.85, 31.65], [35.65, 31.1], [35.45, 30.5]] },
  { id: "sinai-ridge", points: [[32.8, 30.0], [33.25, 29.55], [33.8, 29.05], [34.2, 28.45], [34.55, 27.9]] },
  { id: "taurus-ridge", points: [[27.2, 38.6], [30.0, 38.4], [33.0, 38.8], [36.0, 38.4], [39.0, 38.8]] },
  { id: "zagros-ridge", points: [[42.3, 37.2], [43.4, 35.8], [44.3, 34.2], [45.2, 32.5], [46.6, 30.8]] },
];

const MAP_LABELS = [
  { id: "mediterranean", label: "THE GREAT SEA", at: [27.2, 34.1] as [number, number], kind: "water" },
  { id: "galilee", label: "GALILEE", at: [34.95, 33.02] as [number, number], kind: "region" },
  { id: "samaria", label: "SAMARIA", at: [34.72, 32.3] as [number, number], kind: "region" },
  { id: "judea", label: "JUDEA", at: [34.75, 31.65] as [number, number], kind: "region" },
  { id: "transjordan", label: "TRANSJORDAN", at: [36.35, 32.0] as [number, number], kind: "region" },
  { id: "sinai", label: "SINAI", at: [33.45, 28.8] as [number, number], kind: "region" },
  { id: "egypt", label: "EGYPT", at: [30.4, 29.0] as [number, number], kind: "region" },
  { id: "mesopotamia", label: "MESOPOTAMIA", at: [43.2, 34.2] as [number, number], kind: "region" },
];

function stopPoints(stops: RouteStop[]) {
  return stops
    .map((stop) => PLACES[stop.place])
    .filter(Boolean)
    .map((place) => ({ p: place, xy: project(place.lon, place.lat) }));
}

function cumulative(stops: RouteStop[]) {
  const ids = stops.map((stop) => stop.place).filter((id) => Boolean(PLACES[id]));
  const legs: number[] = [0];
  for (let i = 1; i < ids.length; i++) {
    legs.push(legs[i - 1] + segmentDistanceKm(ids[i - 1], ids[i]));
  }
  return legs;
}

/** Projected, smoothed travel path for a set of stops. */
function routePolyline(stops: RouteStop[]) {
  const ids = stops.map((stop) => stop.place).filter((id) => Boolean(PLACES[id]));
  return poly(routePath(ids));
}

function approximateScaleKm(viewBox: string, zoomLevel: number) {
  const width = Number(viewBox.split(" ")[2]) || VIEW.w;
  const degrees = (width / VIEW.w) * (BOUNDS.lon1 - BOUNDS.lon0) / Math.max(zoomLevel, 1);
  const visibleKm = degrees * 92;
  const candidates = [10, 20, 50, 100, 200, 500, 1000];
  return candidates.find((candidate) => candidate >= visibleKm / 5) ?? 1000;
}

export function AtlasMap({
  focus,
  route,
  compare,
  interactive,
  selectedStop,
  onActiveStopChange,
  navigation = false,
  placeIds,
  selectedPlace,
  onPlaceSelect,
  layers: controlledLayers,
  onLayersChange,
  showLayerControl = false,
  controls = true,
  routeControls = controls,
  navigationControlsClassName,
  layerControlsClassName,
  cinematic = false,
  richAtlas = false,
  className,
}: Props) {
  // Start where the shared journey state already is, so swapping in this
  // surface mid-journey never rewinds to the first stop.
  const [progress, setProgress] = useState(() => {
    if (!route) return 1;
    if (!selectedStop || selectedStop <= 0) return 0;
    const distances = cumulative(route.stops);
    const end = distances.at(-1) ?? 0;
    const index = Math.min(selectedStop, distances.length - 1);
    return end > 0 ? distances[index] / end : 0;
  });
  const [playing, setPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [layerMenu, setLayerMenu] = useState(false);
  const layerTriggerRef = useRef<HTMLButtonElement>(null);
  const layerMenuRef = useRef<HTMLDivElement>(null);
  const [localLayers, setLocalLayers] = useState<MapLayers>({
    places: true,
    water: true,
    modern: false,
    terrain: false,
  });
  const layers = controlledLayers ?? localLayers;
  const raf = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mapGroupRef = useRef<SVGGElement | null>(null);
  const zoomBehavior = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const cameraFrame = useRef<number | null>(null);
  useDismissibleLayer({ refs: [layerTriggerRef, layerMenuRef], enabled: layerMenu, onDismiss: () => setLayerMenu(false), restoreFocusRef: layerTriggerRef });

  const updateLayers = (next: MapLayers) => {
    setLocalLayers(next);
    onLayersChange?.(next);
  };

  const focusIds = useMemo(() => {
    const ids = new Set<string>([...(focus ?? []), ...(placeIds ?? [])]);
    route?.stops.forEach((stop) => ids.add(stop.place));
    compare?.forEach((comparison) => comparison.supportingPlaceIds.forEach((id) => ids.add(id)));
    return [...ids].filter((id) => PLACES[id]);
  }, [focus, placeIds, route, compare]);

  const viewBox = useMemo(() => {
    if (focusIds.length === 0) return `0 0 ${VIEW.w} ${VIEW.h}`;
    const points = [
      ...focusIds.map((id) => project(PLACES[id].lon, PLACES[id].lat)),
      ...(compare ?? []).flatMap((comparison) => comparison.geometry.map(([lon, lat]) => project(lon, lat))),
    ];
    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const comparisonOverview = Boolean(compare?.length);
    // Regional comparisons need breathing room around their complete geometry,
    // not the atlas-wide padding used for sparse discovery markers.
    const horizontalPadding = comparisonOverview ? 36 : 90;
    const verticalPadding = comparisonOverview ? 28 : 70;
    let x0 = Math.min(...xs) - horizontalPadding;
    let x1 = Math.max(...xs) + horizontalPadding;
    let y0 = Math.min(...ys) - verticalPadding;
    let y1 = Math.max(...ys) + verticalPadding;
    const cy = (y0 + y1) / 2;
    const ratio = VIEW.w / VIEW.h;
    let width = Math.max(x1 - x0, comparisonOverview ? 140 : richAtlas ? 300 : 150);
    let height = Math.max(y1 - y0, comparisonOverview ? 90 : richAtlas ? 174 : 78);
    if (width / height < ratio) {
      const nextWidth = height * ratio;
      x0 -= (nextWidth - width) / 2;
      width = nextWidth;
    } else {
      const nextHeight = width / ratio;
      y0 -= (nextHeight - height) / 2;
      height = nextHeight;
    }
    // Comparison journeys stay in the unobscured upper map area while the
    // mobile story card occupies the bottom. This is still derived from the
    // complete route geometry rather than a journey-specific camera point.
    if (comparisonOverview) y0 = cy - height * 0.22;
    return `${x0} ${y0} ${width} ${height}`;
  }, [focusIds, richAtlas, compare]);

  const legs = useMemo(() => (route ? cumulative(route.stops) : []), [route]);
  const total = legs.at(-1) ?? 0;
  const points = useMemo(() => (route ? stopPoints(route.stops) : []), [route]);
  const routeLine = useMemo(() => (route ? routePolyline(route.stops) : ""), [route]);
  const routeCoordinates = useMemo(
    () => (route ? routePath(route.stops.map((stop) => stop.place).filter((id) => Boolean(PLACES[id]))) : []),
    [route],
  );

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const duration = Math.min(28, Math.max(9, (route?.stops.length ?? 1) * 2.2));
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      setProgress((current) => {
        const next = current + delta / duration;
        if (next >= 1) {
          setPlaying(false);
          return 1;
        }
        return next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, route?.stops.length]);

  const travelled = total * progress;
  const marker = useMemo(() => {
    const geographic = pointAlongPath(routeCoordinates, progress);
    return geographic ? project(geographic[0], geographic[1]) : null;
  }, [routeCoordinates, progress]);

  const activeStopIndex = useMemo(() => {
    let index = 0;
    for (let i = 0; i < legs.length; i++) if (travelled >= legs[i] - 0.001) index = i;
    return index;
  }, [legs, travelled]);
  const activeStop = route?.stops[activeStopIndex];
  const lastSelected = useRef<number | null>(selectedStop ?? null);

  const goToStop = useCallback((index: number) => {
    const bounded = Math.min(Math.max(index, 0), Math.max(legs.length - 1, 0));
    setPlaying(false);
    setProgress(total > 0 ? legs[bounded] / total : bounded === 0 ? 0 : 1);
    lastSelected.current = bounded;
    onActiveStopChange?.(bounded);
  }, [legs, total, onActiveStopChange]);

  useEffect(() => {
    if (selectedStop == null || selectedStop === lastSelected.current) return;
    lastSelected.current = selectedStop;
    const bounded = Math.min(Math.max(selectedStop, 0), Math.max(legs.length - 1, 0));
    setPlaying(false);
    const target = total > 0 ? legs[bounded] / total : bounded === 0 ? 0 : 1;
    if (!cinematic || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(target);
      return;
    }
    const started = performance.now();
    let animationFrame = 0;
    setProgress((origin) => {
      const animate = (now: number) => {
        const elapsed = Math.min(1, (now - started) / 850);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        setProgress(origin + (target - origin) * eased);
        if (elapsed < 1) animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
      return origin;
    });
    return () => cancelAnimationFrame(animationFrame);
  }, [selectedStop, legs, total, cinematic]);

  const notify = useRef(onActiveStopChange);
  notify.current = onActiveStopChange;
  useEffect(() => {
    lastSelected.current = activeStopIndex;
    notify.current?.(activeStopIndex);
  }, [activeStopIndex]);

  useEffect(() => {
    const svg = svgRef.current;
    const group = mapGroupRef.current;
    if (!svg || !group || !navigation) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .filter((event) => !event.target.closest?.("[data-map-control]") && (!event.ctrlKey || event.type === "wheel"))
      .on("zoom", (event: { transform: ZoomTransform }) => {
        select(group).attr("transform", event.transform.toString());
        setZoomLevel(event.transform.k);
      });
    zoomBehavior.current = behavior;
    const selection = select(svg);
    selection.call(behavior).on("dblclick.zoom", null);
    return () => {
      selection.on(".zoom", null);
      zoomBehavior.current = null;
    };
  }, [navigation, viewBox]);

  useEffect(() => {
    if (!cinematic || selectedStop == null || !navigation || compare?.length) return;
    const svg = svgRef.current;
    const behavior = zoomBehavior.current;
    const stopPoint = points[selectedStop]?.xy;
    if (!svg || !behavior || !stopPoint) return;
    const [vx, vy, vw, vh] = viewBox.split(" ").map(Number);
    if (!vw || !vh) return;
    const scale = richAtlas ? (selectedStop === 0 ? 1.2 : 1.4) : selectedStop === 0 ? 1.25 : 1.65;
    const target = zoomIdentity
      .translate(vx + vw / 2 - stopPoint[0] * scale, vy + vh / 2 - stopPoint[1] * scale)
      .scale(scale);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      select(svg).call(behavior.transform, target);
      return;
    }
    const origin = zoomTransform(svg);
    const started = performance.now();
    const animate = (now: number) => {
      const elapsed = Math.min(1, (now - started) / 700);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      const frame = zoomIdentity
        .translate(origin.x + (target.x - origin.x) * eased, origin.y + (target.y - origin.y) * eased)
        .scale(origin.k + (target.k - origin.k) * eased);
      select(svg).call(behavior.transform, frame);
      if (elapsed < 1) cameraFrame.current = requestAnimationFrame(animate);
    };
    if (cameraFrame.current) cancelAnimationFrame(cameraFrame.current);
    cameraFrame.current = requestAnimationFrame(animate);
    return () => {
      if (cameraFrame.current) cancelAnimationFrame(cameraFrame.current);
    };
  }, [cinematic, selectedStop, navigation, points, viewBox, richAtlas, compare]);

  const zoomBy = (factor: number) => {
    const svg = svgRef.current;
    const behavior = zoomBehavior.current;
    if (svg && behavior) select(svg).call(behavior.scaleBy, factor);
  };
  const resetView = () => {
    const svg = svgRef.current;
    const behavior = zoomBehavior.current;
    if (svg && behavior) select(svg).call(behavior.transform, zoomIdentity);
  };

  const showLabels = !placeIds || placeIds.length < 18 || zoomLevel >= 2.2;
  const scaleKm = approximateScaleKm(viewBox, zoomLevel);

  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-[var(--color-land)]", cinematic && "rounded-none border-0", richAtlas && "bg-[var(--color-map-parchment)]", className)}>
      {controls && <div className={cn("absolute right-2 top-2 z-20 flex items-center gap-1.5", layerControlsClassName)} data-map-control>
        {showLayerControl && (
          <div className="relative">
            <Button
              ref={layerTriggerRef}
              type="button"
              variant="outline"
              size="icon"
              aria-label="Map layers"
              aria-expanded={layerMenu}
              onClick={() => setLayerMenu((open) => !open)}
              className={cn("rounded-full backdrop-blur", richAtlas ? "bg-[var(--color-map-chrome)] text-[var(--color-map-chrome-foreground)] shadow-lg" : "bg-card/90")}
            >
              <Layers3 aria-hidden />
            </Button>
            {layerMenu && (
              <div ref={layerMenuRef} className="absolute right-0 top-11 w-48 rounded-lg border bg-popover p-2 shadow-lg">
                {([
                  ["places", "Biblical places"],
                  ["water", "Rivers and seas"],
                  ["modern", "Modern orientation"],
                  ["terrain", "Relief context"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-xs hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={layers[key] ?? false}
                      onChange={(event) => updateLayers({ ...layers, [key]: event.target.checked })}
                      className="accent-primary"
                    />
                    {label}
                  </label>
                ))}
                <p className="border-t px-2 pt-2 text-[10px] leading-relaxed text-muted-foreground">
                  Relief is illustrative in this release, not measured elevation.
                </p>
              </div>
            )}
          </div>
        )}
        {!showLayerControl && (
          <Button
            type="button"
            variant={layers.modern ? "default" : "outline"}
            size="sm"
            onClick={() => updateLayers({ ...layers, modern: !layers.modern })}
            aria-pressed={layers.modern}
            className="rounded-full bg-card/90 text-[11px] backdrop-blur"
          >
            <Globe2 aria-hidden />
            {layers.modern ? "Today's map on" : "Show today's map"}
          </Button>
        )}
      </div>}

      {navigation && controls && (
        <div className={cn("absolute left-2 top-2 z-20 flex flex-col gap-1", navigationControlsClassName)} data-map-control>
          <Button type="button" variant="outline" size="icon" onClick={() => zoomBy(1.55)} aria-label="Zoom in" className={richAtlas ? "bg-[var(--color-map-chrome)] text-[var(--color-map-chrome-foreground)] shadow-lg" : "bg-card/90"}><Plus aria-hidden /></Button>
          <Button type="button" variant="outline" size="icon" onClick={() => zoomBy(1 / 1.55)} aria-label="Zoom out" className={richAtlas ? "bg-[var(--color-map-chrome)] text-[var(--color-map-chrome-foreground)] shadow-lg" : "bg-card/90"}><Minus aria-hidden /></Button>
          <Button type="button" variant="outline" size="icon" onClick={resetView} aria-label="Fit map" className={richAtlas ? "bg-[var(--color-map-chrome)] text-[var(--color-map-chrome-foreground)] shadow-lg" : "bg-card/90"}><RotateCcw aria-hidden /></Button>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={viewBox}
        className={cn("block h-auto w-full", navigation && "cursor-grab touch-none active:cursor-grabbing")}
        role="img"
        aria-label={route ? `${route.name} journey map` : "Interactive biblical map"}
        onDoubleClick={navigation ? () => zoomBy(1.7) : undefined}
      >
        <defs>
          <linearGradient id="atlas-parchment" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-map-parchment)" />
            <stop offset="0.56" stopColor="var(--color-land)" />
            <stop offset="1" stopColor="var(--color-map-parchment-deep)" />
          </linearGradient>
          <linearGradient id="atlas-water-depth" x1="0" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="var(--color-map-water-deep)" />
            <stop offset="0.72" stopColor="var(--color-sea)" />
            <stop offset="1" stopColor="var(--color-map-coast)" />
          </linearGradient>
          <radialGradient id="atlas-mountain" cx="36%" cy="28%" r="72%">
            <stop offset="0" stopColor="var(--color-map-relief-high)" stopOpacity="0.72" />
            <stop offset="0.48" stopColor="var(--color-map-relief)" stopOpacity="0.45" />
            <stop offset="1" stopColor="var(--color-map-relief)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="atlas-relief" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-land-edge)" stopOpacity="0.5" />
            <stop offset="0.45" stopColor="var(--color-land)" stopOpacity="0.1" />
            <stop offset="1" stopColor="var(--color-ink-soft)" stopOpacity="0.16" />
          </linearGradient>
          <radialGradient id="atlas-elevation" cx="58%" cy="44%" r="58%">
            <stop offset="0" stopColor="var(--color-land-edge)" stopOpacity="0.34" />
            <stop offset="0.45" stopColor="var(--color-land)" stopOpacity="0.08" />
            <stop offset="1" stopColor="var(--color-route)" stopOpacity="0.05" />
          </radialGradient>
          <filter id="atlas-terrain-noise" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.035" numOctaves="3" seed="18" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="var(--color-land-edge)" surfaceScale="2.2" diffuseConstant="0.65" result="light">
              <feDistantLight azimuth="315" elevation="52" />
            </feDiffuseLighting>
            <feBlend in="SourceGraphic" in2="light" mode="soft-light" />
          </filter>
          <filter id="atlas-paper-grain" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" seed="9" result="grain" />
            <feColorMatrix in="grain" type="saturate" values="0" result="mono" />
            <feBlend in="SourceGraphic" in2="mono" mode="soft-light" />
          </filter>
          <filter id="atlas-route-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="var(--color-map-route-past)" floodOpacity="0.32" />
          </filter>
          <marker id="atlas-route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-route)" />
          </marker>
          {richAtlas && (
            <clipPath id="atlas-land-clip">
              {ATLAS_LAND.map((land, index) => <polygon key={index} points={poly(land)} />)}
            </clipPath>
          )}
        </defs>
        <g ref={mapGroupRef}>
          <rect x={-2000} y={-2000} width={6000} height={6000} fill={richAtlas ? "url(#atlas-water-depth)" : "var(--color-land)"} />
          {richAtlas && (
            <>
              {ATLAS_LAND.map((land, index) => (
                <polygon key={index} points={poly(land)} fill="url(#atlas-parchment)" stroke="var(--color-map-coast)" strokeWidth={1.3} strokeLinejoin="round" />
              ))}
              <g clipPath="url(#atlas-land-clip)">
                <rect x={-2000} y={-2000} width={6000} height={6000} fill="var(--color-map-parchment)" opacity={0.14} filter="url(#atlas-paper-grain)" />
              </g>
            </>
          )}
          {layers.terrain && (
            <>
              {richAtlas ? (
                <g clipPath="url(#atlas-land-clip)">
                  {TERRAIN_MASSES.map((mass) => {
                    const [cx, cy] = project(mass.center[0], mass.center[1]);
                    return <ellipse key={mass.id} cx={cx} cy={cy} rx={mass.rx} ry={mass.ry} transform={`rotate(${mass.rotate} ${cx} ${cy})`} fill="url(#atlas-mountain)" filter="url(#atlas-terrain-noise)" />;
                  })}
                  {RIDGES.map((ridge) => (
                    <g key={ridge.id} fill="none" stroke="var(--color-map-contour)" strokeLinecap="round">
                      <polyline points={poly(ridge.points)} strokeWidth={2.2} />
                      <polyline points={poly(ridge.points.map(([lon, lat]) => [lon + 0.18, lat - 0.12] as [number, number]))} strokeWidth={1.15} opacity={0.72} />
                      <polyline points={poly(ridge.points.map(([lon, lat]) => [lon - 0.2, lat + 0.13] as [number, number]))} strokeWidth={0.85} opacity={0.5} />
                    </g>
                  ))}
                </g>
              ) : (
                <>
                  <rect x={-2000} y={-2000} width={6000} height={6000} fill="url(#atlas-relief)" />
                  <rect x={-2000} y={-2000} width={6000} height={6000} fill="url(#atlas-elevation)" filter="url(#atlas-terrain-noise)" opacity={0.48} />
                </>
              )}
            </>
          )}
          {layers.water !== false && !richAtlas && SEAS.map((sea) => (
            <polygon key={sea.id} points={poly(sea.points)} fill={richAtlas ? "url(#atlas-water-depth)" : "var(--color-sea)"} stroke={richAtlas ? "var(--color-map-coast)" : "var(--color-land-edge)"} strokeWidth={richAtlas ? 2.4 : 1} />
          ))}
          {layers.water !== false && RIVERS.map((river) => (
            <polyline key={river.id} points={poly(river.points)} fill="none" stroke={richAtlas ? "var(--color-map-coast)" : "var(--color-sea)"} strokeWidth={richAtlas ? 2 : 2.5} strokeLinecap="round" opacity={0.9} />
          ))}
          {layers.water !== false && LAKES.map((lake) => {
            const [cx, cy] = project(lake.cx, lake.cy);
            const [rx] = project(BOUNDS.lon0 + lake.rx, 0);
            const [, ry] = project(0, BOUNDS.lat1 - lake.ry);
            return <ellipse key={lake.id} cx={cx} cy={cy} rx={rx} ry={ry} fill={richAtlas ? "var(--color-map-water-deep)" : "var(--color-sea)"} stroke={richAtlas ? "var(--color-map-coast)" : "none"} strokeWidth={richAtlas ? 1.2 : undefined} />;
          })}
          {richAtlas && MAP_LABELS.map((label) => {
            const [x, y] = project(label.at[0], label.at[1]);
            return <text key={label.id} x={x} y={y} textAnchor="middle" fontSize={label.kind === "water" ? 14 : 11} letterSpacing={label.kind === "water" ? 4 : 2.4} fill={label.kind === "water" ? "var(--color-map-coast)" : "var(--color-map-contour)"} className="pointer-events-none font-serif" fontStyle={label.kind === "water" ? "italic" : undefined} opacity={0.82}>{label.label}</text>;
          })}
          {layers.modern && MODERN_BORDERS.map((border) => {
            const [labelX, labelY] = project(border.labelAt[0], border.labelAt[1]);
            return (
              <g key={border.id}>
                <polygon points={poly(border.points)} fill="var(--color-ink-soft)" fillOpacity={0.04} stroke="var(--color-ink-soft)" strokeWidth={1.1} strokeDasharray="4 4" opacity={0.7} />
                <text x={labelX} y={labelY} fontSize={11} textAnchor="middle" fill="var(--color-muted-foreground)" className="font-sans" opacity={0.85}>{border.label}</text>
              </g>
            );
          })}
          {compare?.map((comparison) => (
            <polyline key={comparison.id} points={poly(comparison.geometry)} fill="none" stroke="var(--color-map-route-comparison)" strokeWidth={2.25} strokeDasharray="6 7" strokeLinecap="round" opacity={0.68} />
          ))}
          {route && points.length > 1 && (
            <>
              <polyline points={routeLine} fill="none" stroke={richAtlas ? "var(--color-map-route-future)" : "var(--color-route)"} strokeWidth={richAtlas ? 3 : 2} strokeDasharray={richAtlas ? "7 7" : undefined} opacity={richAtlas ? 0.9 : 0.22} />
              <polyline points={routeLine} fill="none" stroke={richAtlas ? "var(--color-map-route-past)" : "var(--color-route)"} strokeWidth={richAtlas ? 4 : 3} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} markerEnd="url(#atlas-route-arrow)" filter={richAtlas ? "url(#atlas-route-shadow)" : undefined} />
            </>
          )}
          {richAtlas && route && points.map((point, index) => {
            const reached = index <= activeStopIndex;
            const selected = index === activeStopIndex;
            return (
              <g key={`route-stop-${point.p.id}-${index}`} className="pointer-events-none">
                {selected && <circle cx={point.xy[0]} cy={point.xy[1]} r={13} fill="none" stroke="var(--color-map-route-past)" strokeWidth={1.5} opacity={0.42} />}
                <circle cx={point.xy[0]} cy={point.xy[1]} r={selected ? 7 : 5.5} fill={reached ? "var(--color-map-route-past)" : "var(--color-map-parchment)"} stroke="var(--color-map-chrome)" strokeWidth={2} />
                <text x={point.xy[0]} y={point.xy[1] + 2.6} textAnchor="middle" fontSize={selected ? 6.5 : 5.5} fontWeight={700} fill={reached ? "var(--color-map-chrome)" : "var(--color-map-chrome-foreground)"} className="font-sans">{index + 1}</text>
              </g>
            );
          })}
          {layers.places !== false && focusIds.map((id) => {
            const place = PLACES[id];
            const [x, y] = project(place.lon, place.lat);
            const region = place.kind === "region" || place.kind === "mountain";
            const selected = selectedPlace === id;
            return (
              <g
                key={id}
                role={onPlaceSelect ? "button" : undefined}
                tabIndex={onPlaceSelect ? 0 : undefined}
                aria-label={onPlaceSelect ? `Select ${place.name}` : undefined}
                className={onPlaceSelect ? "cursor-pointer outline-none" : undefined}
                onClick={(event) => { event.stopPropagation(); onPlaceSelect?.(id); }}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onPlaceSelect?.(id); }}
              >
                {selected && <circle cx={x} cy={y} r={12} fill="var(--color-primary)" opacity={0.2} />}
                {region ? (
                  <circle cx={x} cy={y} r={selected ? 5 : 4} fill="var(--color-land)" stroke="var(--color-ink-soft)" strokeWidth={1.6} />
                ) : (
                  <>
                    <circle cx={x} cy={y} r={7} fill="var(--color-place)" opacity={0.18} />
                    <circle cx={x} cy={y} r={selected ? 4.6 : 3.4} fill={selected ? "var(--color-primary)" : "var(--color-place)"} stroke={selected ? "var(--color-background)" : "none"} strokeWidth={1.5} />
                  </>
                )}
                {(!cinematic || selected || (richAtlas && zoomLevel >= 1.45)) && (showLabels || selected) && (
                  <text x={x + 9} y={y + (selected ? -9 : 4)} fontSize={selected && richAtlas ? 13 : 11} fontWeight={selected ? 700 : 500} paintOrder={richAtlas ? "stroke" : undefined} stroke={richAtlas ? "var(--color-map-parchment)" : undefined} strokeWidth={richAtlas ? 3.5 : undefined} strokeLinejoin="round" fill={selected && richAtlas ? "var(--color-map-chrome-foreground)" : "var(--color-ink-soft)"} className={cn("pointer-events-none", richAtlas ? "font-serif" : "font-sans")}>{place.name}</text>
                )}
                {layers.modern && MODERN_NAMES[id] && (!cinematic || selected) && (showLabels || selected) && (
                  <text x={x + 8} y={y + 15} fontSize={9.5} fill="var(--color-muted-foreground)" className="pointer-events-none font-sans">{MODERN_NAMES[id]}</text>
                )}
              </g>
            );
          })}
          {interactive && route && points.map((stop, index) => (
            <circle key={`hit-${index}`} cx={stop.xy[0]} cy={stop.xy[1]} r={13} fill="transparent" className="cursor-pointer" tabIndex={0} role="button" aria-label={`Go to ${route.stops[index]?.label ?? stop.p.name}`} onClick={() => goToStop(index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") goToStop(index); }} />
          ))}
          {marker && route && (
            <g>
              <circle cx={marker[0]} cy={marker[1]} r={10} fill="var(--color-route)" opacity={0.22} />
              <circle cx={marker[0]} cy={marker[1]} r={5} fill="var(--color-route)" stroke="var(--color-background)" strokeWidth={2} />
            </g>
          )}
        </g>
      </svg>

      {navigation && (
        <div className="pointer-events-none absolute bottom-2 left-3 z-10 text-[10px] text-muted-foreground" aria-hidden>
          <span className="mb-1 block w-16 border-t-2 border-foreground/60" />≈ {scaleKm} km
        </div>
      )}

      {route && routeControls && (
        <div className="space-y-2 border-t bg-card px-3 py-3" data-map-control>
          <div className="flex items-center gap-2">
            <Button type="button" size="icon" onClick={() => { if (progress >= 1) setProgress(0); setPlaying((value) => !value); }} aria-label={playing ? "Pause route" : "Play route"} className="rounded-full"><span>{playing ? <Pause aria-hidden /> : <Play aria-hidden />}</span></Button>
            <Button type="button" variant="outline" size="icon" onClick={() => { setPlaying(false); setProgress(0); }} aria-label="Restart route" className="rounded-full"><RotateCcw aria-hidden /></Button>
            {interactive && (
              <>
                <Button type="button" variant="outline" size="icon" onClick={() => goToStop(activeStopIndex - 1)} disabled={activeStopIndex <= 0} aria-label="Previous stop" className="rounded-full"><SkipBack aria-hidden /></Button>
                <Button type="button" variant="outline" size="icon" onClick={() => goToStop(activeStopIndex + 1)} disabled={activeStopIndex >= legs.length - 1} aria-label="Next stop" className="rounded-full"><SkipForward aria-hidden /></Button>
              </>
            )}
            <input
              type="range"
              min={0}
              max={1000}
              value={Math.round(progress * 1000)}
              onChange={(event) => { setPlaying(false); setProgress(Number(event.target.value) / 1000); }}
              className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-[var(--color-route)]"
              aria-label="Journey progress"
              aria-valuetext={`${activeStop?.label ?? (activeStop ? PLACES[activeStop.place]?.name : route.name)}, ${Math.round(travelled).toLocaleString()} km of ${Math.round(total).toLocaleString()} km approximate route total`}
            />
          </div>
          <div className="flex items-baseline justify-between gap-3 text-xs" aria-live="polite">
            <span className="font-medium text-foreground">{activeStop?.label ?? (activeStop ? PLACES[activeStop.place]?.name ?? activeStop.place : route.name)}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{Math.round(travelled).toLocaleString()} km of {Math.round(total).toLocaleString()} km</span>
          </div>
          {activeStop?.note && <p className="text-xs leading-relaxed text-muted-foreground">{activeStop.note}</p>}
          <p className="text-[10px] text-muted-foreground">Approximate route follows known terrain and ancient travel corridors; the precise historical path may be uncertain.</p>
          {compare?.length ? (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-[var(--color-route)]" /> {route.name}</span>
               {compare.map((comparison) => <span key={comparison.id} className="inline-flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-[var(--color-map-route-comparison)]" />{comparison.name}</span>)}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export const mapClasses = cn;