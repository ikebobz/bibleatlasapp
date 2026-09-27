/** Real-geography atlas surface powered by Mapbox GL, with the bundled SVG atlas as fallback. */
import { MAP_FEATURE_BY_ID } from "@/lib/atlas/catalogue";

import { CONTEXT_RESTORE_GRACE_MS, isFatalMapError, loadTimedOut, mapWarn, webglSupported } from "@/lib/atlas/map-debug";
import { Layers, Mountain, Satellite, Map as MapIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapboxMap, MapMouseEvent } from "mapbox-gl";
// Explicit URL so we can await the stylesheet before mapbox measures its
// container — an unapplied stylesheet leaves the canvas container heightless.
import mapboxCssUrl from "mapbox-gl/dist/mapbox-gl.css?url";
import { Button } from "@/components/ui/button";
import {
  ATLAS_SOURCE_ID,
  MAPBOX_TOKEN,
  MAP_STYLES,
  MAP_STYLE_IDS,
  buildAtlasStyle,
  combinedRouteBounds,
  placesBounds,
  placesGeoJSON,
  responsiveCameraPadding,
  routeGeoJSON,
  segmentBounds,
  type AtlasFeatureCollection,
  type MapStyleId,
} from "@/lib/atlas/mapbox";
import { PLACES } from "@/lib/atlas/geo";
import type { RouteStop } from "@/lib/atlas/types";
import type { JourneyComparisonRoute } from "@/lib/atlas/journeys";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";
import { cn } from "@/lib/utils";

const STYLE_STORAGE_KEY = "bible-atlas:map-style";

function readStoredStyle(): MapStyleId {
  if (typeof window === "undefined") return "outdoors";
  try {
    const value = window.localStorage.getItem(STYLE_STORAGE_KEY);
    return MAP_STYLE_IDS.includes(value as MapStyleId) ? (value as MapStyleId) : "outdoors";
  } catch {
    return "outdoors";
  }
}

type MapboxModule = typeof import("mapbox-gl");

type Props = {
  route?: { name: string; stops: RouteStop[] };
  compare?: JourneyComparisonRoute[];
  selectedStop?: number | null;
  selectedPlace?: string | null;
  placeIds?: string[];
  onPlaceSelect?: (placeId: string) => void;
  onElevation?: (meters: number | null) => void;
  compact?: boolean;
  onFallback: (reason: string) => void;
  className?: string;
};

/** Mapbox only parses hex/rgb/hsl, so modern oklch() tokens must be rasterised
 *  to rgb first — an unparseable colour rejects the whole style. */
function toRgb(value: string, fallback: string) {
  if (!value) return fallback;
  if (/^#|^rgb|^hsl/i.test(value)) return value;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = value;
    if (ctx.fillStyle === "#000000" && value !== "#000000") {
      // Unsupported syntax: fillStyle stayed at the sentinel.
      return fallback;
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    if (a === 0) return fallback;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return fallback;
  }
}

function cssColor(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return toRgb(value, fallback);
}

function atlasColors() {
  return {
    route: cssColor("--color-map-route-past", "#8a4a2b"),
    comparison: cssColor("--color-map-route-comparison", "#4f7482"),
    ink: cssColor("--color-foreground", "#241a10"),
    paper: cssColor("--color-map-parchment", "#f3e7cf"),
  };
}


const NO_COMPARE: JourneyComparisonRoute[] = [];

export function MapboxAtlas({
  route,
  compare = NO_COMPARE,
  selectedStop,
  selectedPlace,
  placeIds,
  onPlaceSelect,
  onElevation,
  compact = false,
  onFallback,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [mapboxgl, setMapboxgl] = useState<MapboxModule | null>(null);
  const [styleId, setStyleId] = useState<MapStyleId>(readStoredStyle);
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const styleButtonRef = useRef<HTMLButtonElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [routeProgress, setRouteProgress] = useState(selectedStop ?? 0);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;
  const onElevationRef = useRef(onElevation);
  onElevationRef.current = onElevation;

  /* Persist the chosen surface so the menu rarely needs opening again. */
  useEffect(() => {
    if (compact) return;
    try {
      window.localStorage.setItem(STYLE_STORAGE_KEY, styleId);
    } catch {
      /* private mode etc. — preference simply won't persist */
    }
  }, [styleId, compact]);

  useDismissibleLayer({
    refs: [styleMenuRef, styleButtonRef],
    onDismiss: () => setStyleMenuOpen(false),
    enabled: styleMenuOpen,
    restoreFocusRef: styleButtonRef,
  });
  const stops = route?.stops;
  const stopsKey = useMemo(
    () => (stops ? stops.map((stop) => `${stop.place}:${stop.label ?? ""}`).join("|") : ""),
    [stops],
  );
  const placeKey = useMemo(() => (placeIds ?? []).join("|"), [placeIds]);
  const compareKey = useMemo(
    () => compare.map((item) => `${item.id}:${item.geometry.length}`).join("|"),
    [compare],
  );

  const data = useMemo<AtlasFeatureCollection>(
    () => (stops ? routeGeoJSON(stops, routeProgress, compare) : placesGeoJSON(placeIds ?? [], selectedPlace)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopsKey, placeKey, compareKey, selectedPlace, routeProgress],
  );
  // The style builder runs outside React's render cycle and needs the latest data.
  const latestDataRef = useRef(data);
  latestDataRef.current = data;

  useEffect(() => {
    const target = selectedStop ?? 0;
    if (!stops || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRouteProgress(target);
      return;
    }
    let frame = 0;
    const origin = routeProgress;
    const started = performance.now();
    const animate = (now: number) => {
      const amount = Math.min(1, (now - started) / 1100);
      const eased = 1 - Math.pow(1 - amount, 3);
      setRouteProgress(origin + (target - origin) * eased);
      if (amount < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
    // routeProgress is deliberately captured as the animation origin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStop, stopsKey]);

  const cameraPadding = useCallback((map: MapboxMap) => {
    const container = map.getContainer();
    const section = container.closest("section");
    const base = responsiveCameraPadding(container.clientWidth, container.clientHeight);
    if (!section) return base;
    const sectionRect = section.getBoundingClientRect();
    let top = base.top;
    let bottom = base.bottom;
    for (const node of section.querySelectorAll<HTMLElement>("[data-map-padding]")) {
      const rect = node.getBoundingClientRect();
      if (node.dataset.mapPadding === "top") top = Math.max(top, rect.bottom - sectionRect.top + 12);
      if (node.dataset.mapPadding === "bottom") bottom = Math.max(bottom, sectionRect.bottom - rect.top + 12);
    }
    return { ...base, top, bottom };
  }, []);

  const frameContent = useCallback(
    (map: MapboxMap) => {
       const bounds = stops ? combinedRouteBounds(stops, compare) : placesBounds(placeIds ?? []);
      if (bounds) {
        const container = map.getContainer();
        map.fitBounds(bounds, {
          padding: cameraPadding(map),
           maxZoom: compare.length > 0 ? 7.25 : stops && stops.length <= 3 ? 9 : 7.5,
          duration: 0,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopsKey, placeKey, compareKey, cameraPadding, compare],
  );

  /* Only start a real map when the surface is genuinely on screen and the page
     is idle. Mapbox bills per map creation, so prerenders, crawlers, hidden
     tabs and instant bounces must never create one. */
  const [active, setActive] = useState(false);
  useEffect(() => {
    const node = containerRef.current;
    if (!node || active) return;
    let idleHandle = 0;
    const start = () => {
      const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback;
      idleHandle = idle ? idle(() => setActive(true)) : window.setTimeout(() => setActive(true), 300);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (document.visibilityState === "visible") start();
        else document.addEventListener("visibilitychange", start, { once: true });
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", start);
      if (idleHandle) window.clearTimeout(idleHandle);
    };
  }, [active]);

  /* Load mapbox-gl lazily so the SVG atlas and initial bundle stay light. */
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    if (!webglSupported()) {
      mapWarn("WebGL unavailable — switching to offline atlas");
      onFallback("graphics acceleration unavailable (webgl)");
      return;
    }
    const load = async () => {
      // Await the stylesheet before the library measures its container.
      if (!document.querySelector(`link[href="${mapboxCssUrl}"]`)) {
        await new Promise<void>((resolve, reject) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = mapboxCssUrl;
          link.onload = () => resolve();
          link.onerror = () => reject(new Error("mapbox css failed"));
          document.head.appendChild(link);
        });
      }
      const mod = await import("mapbox-gl");
      if (!cancelled) setMapboxgl(mod);
    };
    void load().catch((error) => {
      mapWarn("mapbox-gl failed to load — switching to offline atlas", error);
      onFallback("mapbox-gl failed to load");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);


  /* Create the map once the library and container are available. The journey
     layers are merged into the style itself, so the A-to-B line is painted on
     the first frame rather than waiting for a load event that may never fire. */
  useEffect(() => {
    if (!mapboxgl || !containerRef.current || mapRef.current) return;
    let disposed = false;
    let created: MapboxMap | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let resizeFrame = 0;
    let loadTimer = 0;
    let contextTimer = 0;
    let onContextLost: (() => void) | null = null;
    let onContextRestored: (() => void) | null = null;

    const start = async () => {
      const style = await buildAtlasStyle(compact ? "terrain" : styleId, latestDataRef.current, atlasColors());
      if (disposed || !containerRef.current || mapRef.current) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        accessToken: MAPBOX_TOKEN,
        style: style as never,
        center: [35.3, 31.8],
        zoom: 5.4,
        attributionControl: false,
        fadeDuration: reduced ? 0 : 300,
      });
      created = map;
      mapRef.current = map;
      map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
      if (!compact) map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-left");
      // Expose for diagnostics and e2e checks.
      (window as unknown as { __atlasMap?: MapboxMap }).__atlasMap = map;

      const pickPlace = (event: MapMouseEvent) => {
        const feature = event.features?.[0] as unknown as { properties?: { place?: unknown } } | undefined;
        if (typeof feature?.properties?.place === "string") onPlaceSelectRef.current?.(feature.properties.place);
      };
      map.on("click", "atlas-stops", pickPlace);
      map.on("click", "atlas-places", pickPlace);
      for (const layer of ["atlas-stops", "atlas-places"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
      const createdAt = performance.now();
      map.on("error", (event) => {
        const error = event.error as { status?: number; url?: string; message?: string } | undefined;
        const status = error?.status;
        const details = {
          status,
          sourceId: (event as unknown as { sourceId?: string }).sourceId,
          url: error?.url,
          message: error?.message,
          elapsedMs: Math.round(performance.now() - createdAt),
          error: event.error,
        };
        if (isFatalMapError(status)) {
          mapWarn(`fatal map error ${status} — switching to offline atlas`, details);
          onFallback(`map error ${status}`);
        } else {
          mapWarn("transient map error ignored", details);
        }
      });

      // Only an initial style that never loads counts as failure. Once loaded,
      // tiles loading during camera moves are normal and never trigger fallback.
      let lastProgress = performance.now();
      const markProgress = () => {
        lastProgress = performance.now();
      };
      map.on("data", markProgress);
      loadTimer = window.setInterval(() => {
        if (disposed || mapRef.current !== map) return;
        const now = performance.now();
        if (!loadTimedOut(now - createdAt, now - lastProgress)) return;
        window.clearInterval(loadTimer);
        mapWarn("style did not load in time — switching to offline atlas", { elapsedMs: Math.round(now - createdAt) });
        onFallback("map style did not load");
      }, 1000);
      map.once("load", () => {
        window.clearInterval(loadTimer);
        map.off("data", markProgress);
      });

      const canvas = map.getCanvas();
      onContextLost = () => {
        mapWarn("WebGL context lost; waiting 3s for restore");
        window.clearTimeout(contextTimer);
        contextTimer = window.setTimeout(() => {
          if (disposed) return;
          mapWarn("WebGL context not restored — switching to offline atlas");
          onFallback("webgl context lost");
        }, CONTEXT_RESTORE_GRACE_MS);
      };
      onContextRestored = () => {
        mapWarn("WebGL context restored");
        window.clearTimeout(contextTimer);
      };
      canvas.addEventListener("webglcontextlost", onContextLost);
      canvas.addEventListener("webglcontextrestored", onContextRestored);
      setReady(true);
      const reframe = () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
          if (disposed || mapRef.current !== map) return;
          map.resize();
          if (!selectedPlace) frameContent(map);
        });
      };
      resizeObserver = new ResizeObserver(() => {
        reframe();
      });
      resizeObserver.observe(map.getContainer());
      const section = map.getContainer().closest("section");
      if (section) {
        resizeObserver.observe(section);
        section.querySelectorAll<HTMLElement>("[data-map-padding]").forEach((node) => resizeObserver?.observe(node));
        mutationObserver = new MutationObserver(() => {
          section.querySelectorAll<HTMLElement>("[data-map-padding]").forEach((node) => resizeObserver?.observe(node));
          reframe();
        });
        mutationObserver.observe(section, { childList: true, subtree: true });
      }
    };

    void start().catch((error) => {
      mapWarn("map style failed to load — switching to offline atlas", error);
      onFallback("map style failed to load");
    });

    return () => {
      disposed = true;
      mapRef.current = null;
      setReady(false);
      window.clearInterval(loadTimer);
      window.clearTimeout(contextTimer);
       window.cancelAnimationFrame(resizeFrame);
      if (created) {
        const canvas = (created as MapboxMap).getCanvas();
        if (onContextLost) canvas.removeEventListener("webglcontextlost", onContextLost);
        if (onContextRestored) canvas.removeEventListener("webglcontextrestored", onContextRestored);
        (resizeObserver as ResizeObserver | null)?.disconnect();
         (mutationObserver as MutationObserver | null)?.disconnect();
        created.remove();
        const win = window as unknown as { __atlasMap?: MapboxMap };
        if (win.__atlasMap === created) delete win.__atlasMap;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxgl]);

  /* Push new journey/place data into the live source. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    try {
      (map.getSource(ATLAS_SOURCE_ID) as GeoJSONSource | undefined)?.setData(data);
    } catch {
      /* the source arrives with the style; nothing to do yet */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, ready]);

  useEffect(() => {
    const map = mapRef.current;
    const place = selectedPlace ? PLACES[selectedPlace] : undefined;
    if (!map || !ready || !place || !onElevationRef.current) return;
    const update = () => {
      const value = map.queryTerrainElevation([place.lon, place.lat], { exaggerated: false });
      if (typeof value === "number" && Number.isFinite(value)) onElevationRef.current?.(Math.round(value));
    };
    map.on("idle", update);
    update();
    return () => { map.off("idle", update); };
  }, [selectedPlace, ready, styleId]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && ready && !selectedPlace) frameContent(map);
  }, [stopsKey, placeKey, ready, selectedPlace, frameContent]);

  /* Camera follows the active route segment, keeping it above mobile cards. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targetId = selectedPlace ?? (stops && typeof selectedStop === "number" ? stops[selectedStop]?.place : undefined);
    const place = targetId ? PLACES[targetId] : undefined;
    if (!place) return;
    const padding = cameraPadding(map);
     if (!selectedPlace && stops && typeof selectedStop === "number" && compare.length > 0) {
       const bounds = combinedRouteBounds(stops, compare);
       if (bounds) {
         map.fitBounds(bounds, {
           padding,
           maxZoom: 7.25,
           duration: reduced ? 0 : 800,
           pitch: styleId === "terrain" ? 28 : 0,
           bearing: 0,
         });
         return;
       }
     }
    if (!selectedPlace && stops && typeof selectedStop === "number" && selectedStop > 0) {
      const bounds = segmentBounds(stops, selectedStop);
      if (bounds) {
        map.fitBounds(bounds, {
          padding,
          maxZoom: 8.5,
          duration: reduced ? 0 : 900,
          pitch: styleId === "terrain" ? 34 : 0,
          bearing: 0,
        });
        return;
      }
    }
    if (selectedPlace) {
      // Town-level close-up. Offline, stay within the depth saved for offline use.
      const online = typeof navigator === "undefined" || navigator.onLine;
      const maxZoom = online ? 13.5 : 8;
      const boundary = MAP_FEATURE_BY_ID[selectedPlace]?.boundary;
      if (boundary) {
        const ring = boundary.coordinates[0];
        const lons = ring.map((c) => c[0]);
        const lats = ring.map((c) => c[1]);
        const w = Math.min(...lons), e = Math.max(...lons), so = Math.min(...lats), n = Math.max(...lats);
        const px = (e - w) * 0.2, py = (n - so) * 0.2;
        map.fitBounds([[w - px, so - py], [e + px, n + py]], { padding, maxZoom, duration: reduced ? 0 : 1000, bearing: 0, pitch: styleId === "terrain" ? 34 : 0 });
        return;
      }
      map.flyTo({
        center: [place.lon, place.lat],
        zoom: Math.min(12.5, maxZoom),
        duration: reduced ? 0 : 1000,
        essential: true,
        padding,
        bearing: 0,
        pitch: styleId === "terrain" ? 34 : 0,
      });
      return;
    }
    map.flyTo({
      center: [place.lon, place.lat],
      zoom: Math.min(Math.max(map.getZoom(), 7), 8),
      duration: reduced ? 0 : 600,
      essential: true,
      padding,
      bearing: 0,
      pitch: styleId === "terrain" ? 34 : 0,
    });
   }, [selectedStop, selectedPlace, ready, stops, styleId, cameraPadding, compare]);

  /* Switch surface (topographic / satellite / 3D terrain). The rebuilt style
     carries the journey layers and terrain with it. */
  const styleInitRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!styleInitRef.current) {
      styleInitRef.current = true;
      return;
    }
    let cancelled = false;
    void buildAtlasStyle(compact ? "terrain" : styleId, latestDataRef.current, atlasColors())
      .then((style) => {
        if (cancelled || !mapRef.current) return;
        map.setStyle(style as never);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        map.easeTo({ pitch: styleId === "terrain" ? 34 : 0, duration: reduced ? 0 : 600 });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleId, ready]);

  return (
    <div className={cn("atlas-mapbox relative h-full w-full", className)} data-testid="mapbox-atlas">
      {/* Inline positioning: .mapboxgl-map sets position:relative and would
          otherwise override the utility class and collapse the container. */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ position: "absolute", inset: 0 }}
        aria-label="Interactive Bible geography map"
      />
      {ready && !compact && (
        <div className="absolute right-3 top-20 z-10 sm:right-5" data-map-control>
          <button
            ref={styleButtonRef}
            type="button"
            aria-label="Change map style"
            aria-expanded={styleMenuOpen}
            aria-haspopup="menu"
            onClick={() => setStyleMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border bg-[var(--color-map-chrome)] text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl transition-colors hover:bg-[var(--color-map-chrome)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Layers className="h-4.5 w-4.5" aria-hidden />
          </button>
          {styleMenuOpen && (
            <div
              ref={styleMenuRef}
              role="menu"
              aria-label="Map style"
              className="absolute right-0 top-[3.25rem] flex min-w-44 flex-col gap-1 rounded-lg border bg-[var(--color-map-chrome)] p-1 text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl"
            >
              {MAP_STYLE_IDS.map((id) => (
                <Button
                  key={id}
                  type="button"
                  size="sm"
                  variant={styleId === id ? "default" : "ghost"}
                  onClick={() => {
                    setStyleId(id);
                    setStyleMenuOpen(false);
                    styleButtonRef.current?.focus();
                  }}
                  aria-pressed={styleId === id}
                  className="min-h-11 justify-start gap-2 px-2 text-xs"
                >
                  {id === "outdoors" ? (
                    <MapIcon className="h-3.5 w-3.5" aria-hidden />
                  ) : id === "satellite" ? (
                    <Satellite className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Mountain className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {MAP_STYLES[id].label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
