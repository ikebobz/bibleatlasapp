import { Network } from 'lucide-react';
import { clearLiveMapFailed, fallbackMessage, liveMapFailReason, liveMapFailedThisSession, markLiveMapFailed } from "@/lib/atlas/map-debug";
import { NODE_BY_ENTRY } from '@/lib/threads/graph';
import { trackNav } from '@/lib/analytics/nav-events';
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,

  Landmark,
  Map as MapIcon,
  MapPin,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  Save,
  Search,
  Share2,
  Waves,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AtlasMap, type MapLayers } from "./AtlasMap";
import { MapboxAtlas } from "./MapboxAtlas";
import { MapPlaceCard } from "./MapPlaceCard";
import { hasMapbox } from "@/lib/atlas/mapbox";
import { OfflineMapControl } from "./OfflineMapControl";

import { Button } from "@/components/ui/button";
import { useTranslationSetting } from "@/components/reader/settings";
import {
  MAP_FEATURES,
  MAP_FEATURE_BY_ID,
  certaintyLabel,
  searchMapCatalogue,
  type MapFeatureKind,
} from "@/lib/atlas/catalogue";
import { PLACES } from "@/lib/atlas/geo";
import { JOURNEYS, journeySegments, legDistances, mixedTravelEstimate, totalDistanceKm } from "@/lib/atlas/journeys";
import { chapterQuery } from "@/lib/chapter-query";
import { nativeShare } from "@/lib/share";
import type { MapReturn } from "@/lib/atlas/reader-return";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";
import { MapLegend } from "./MapLegend";
import { LiveStatus, StateMessage } from "@/components/ui/state-message";

export type ExplorerSearch = {
  place?: string;
  q?: string;
  journey?: string;
  leg?: string;
  stop?: number;
  from?: string;
};

export type MapsExplorerProps = {
  initialPlace?: string;
  initialQuery?: string;
  initialJourney?: string;
  initialLeg?: string;
  initialStop?: number;
  /** Where the reader came from, so the map can offer a way straight back. */
  back?: MapReturn | null;
  /** Each route owns its own navigation; the explorer just describes the change. */
  updateSearch: (patch: ExplorerSearch) => void;
  /** Journey routes change the path rather than a search param. */
  onJourneyChange?: (id: string) => void;
};

const SAVE_KEY = "bible-atlas:saved-journeys";

const CATEGORIES: Array<{ label: string; kinds: MapFeatureKind[]; icon: typeof MapPin }> = [
  { label: "Places", kinds: ["city"], icon: MapPin },
  { label: "Regions", kinds: ["region"], icon: MapIcon },
  { label: "Mountains", kinds: ["mountain"], icon: Mountain },
  { label: "Rivers & seas", kinds: ["water"], icon: Waves },
  { label: "Archaeology", kinds: ["archaeology"], icon: Landmark },
];

export function MapsExplorer({
  initialPlace,
  initialQuery,
  initialJourney,
  initialLeg,
  initialStop,
  back,
  updateSearch,
  onJourneyChange,
}: MapsExplorerProps) {
  const translation = useTranslationSetting();
  const [query, setQuery] = useState(initialQuery ?? "");
  const [category, setCategory] = useState<string>("Places");
  const [journeyId, setJourneyId] = useState(
    initialJourney && JOURNEYS.some((item) => item.id === initialJourney) ? initialJourney : "jesus",
  );
  const [legId, setLegId] = useState(initialLeg ?? "");
  const [stop, setStop] = useState(initialStop ?? 0);
  const [playing, setPlaying] = useState(false);
  const [verseOpen, setVerseOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(true);
  const [placeCardOpen, setPlaceCardOpen] = useState(Boolean(initialPlace));
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const discoverRef = useRef<HTMLElement>(null);
  const discoverTriggerRef = useRef<HTMLButtonElement>(null);
  const placeCardRef = useRef<HTMLElement>(null);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [layers, setLayers] = useState<MapLayers>({ places: true, water: true, modern: false, terrain: true });
  const [online, setOnline] = useState(false);
  const [mapboxFailed, setMapboxFailed] = useState(liveMapFailedThisSession);
  const [failReason, setFailReason] = useState<string | null>(liveMapFailReason);
  // Whether the live map was ever shown this visit; after that, connectivity
  // changes alone never swap surfaces mid-journey.
  const liveStartedRef = useRef(false);
  // Verified offline availability, reported by the offline-map control.
  const [offlineAvailable, setOfflineAvailable] = useState(false);
  // Mounted gate: server and first client render both show the SVG atlas, so
  // hydration matches; the live map swaps in after mount when online.
  const [mounted, setMounted] = useState(false);
  // A verified saved atlas keeps the real map usable with no network at all.
  const wantsMapbox = mounted && hasMapbox && (online || offlineAvailable || liveStartedRef.current) && !mapboxFailed;
  if (wantsMapbox) liveStartedRef.current = true;
  const useMapbox = wantsMapbox;

  const selectedPlace = initialPlace && MAP_FEATURE_BY_ID[initialPlace] ? initialPlace : null;
  const journey = JOURNEYS.find((item) => item.id === journeyId) ?? JOURNEYS[0];
  const leg = journey.legs.find((item) => item.id === legId) ?? journey.legs[0];
  const active = leg.stops[stop] ?? leg.stops[0];
  const activePlace = active ? PLACES[active.place] : undefined;
  const activeFeature = active ? MAP_FEATURE_BY_ID[active.place] : undefined;
  const distances = useMemo(() => legDistances(leg.stops, leg.bySea), [leg.stops, leg.bySea]);
  const total = totalDistanceKm(leg.stops, leg.bySea);
  const travelled = distances[stop] ?? 0;
  const routeSegments = useMemo(() => journeySegments(leg.stops, leg.bySea), [leg.stops, leg.bySea]);
  const activeSegment = stop > 0 ? routeSegments[stop - 1] : routeSegments[0];
  const accuracyLabel = activeSegment?.historicalAccuracy === "verified"
    ? "Well-attested route"
    : activeSegment?.historicalAccuracy === "schematic"
      ? "Schematic route"
      : "Approximate route";
  
  const journeyCategories = useMemo(() => {
    const groups: Record<string, typeof JOURNEYS> = {};
    JOURNEYS.forEach(j => {
      if (!groups[j.category]) groups[j.category] = [];
      groups[j.category].push(j);
    });
    return groups;
  }, []);
const categoryConfig = CATEGORIES.find((item) => item.label === category) ?? CATEGORIES[0];
  const categoryFeatures = MAP_FEATURES.filter((feature) => categoryConfig.kinds.includes(feature.kind));
  const visibleFeatures = query.trim() ? searchMapCatalogue(query).features : categoryFeatures;
  const results = useMemo(() => searchMapCatalogue(query), [query]);
  // The opened place must always be marked, even when it is a region, mountain
  // or water feature that the current category filter excludes.
  const markerPlaceIds = useMemo(
    () =>
      selectedPlace
        ? [selectedPlace, ...visibleFeatures.map((feature) => feature.id).filter((id) => id !== selectedPlace)]
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPlace, visibleFeatures.map((feature) => feature.id).join("|")],
  );
  const passageLink = active?.link;
  const passageQuery = useQuery({
    ...chapterQuery(passageLink?.book ?? journey.read.book, passageLink?.chapter ?? journey.read.chapter, translation),
    enabled: verseOpen && Boolean(passageLink),
  });
  const passageVerse = passageLink?.verse
    ? passageQuery.data?.verses.find((verse) => verse.number === passageLink.verse)
    : passageQuery.data?.verses[0];

  // Deep links (and journey-route navigation) drive the selected journey.
  useEffect(() => {
    if (initialJourney && JOURNEYS.some((item) => item.id === initialJourney)) {
      setJourneyId(initialJourney);
    }
  }, [initialJourney]);
  useEffect(() => {
    setLegId(initialLeg ?? "");
  }, [initialLeg]);
  useEffect(() => {
    setStop(initialStop ?? 0);
  }, [initialStop]);

  useEffect(() => {
    if (selectedPlace) setPlaceCardOpen(true);
  }, [selectedPlace]);

  useDismissibleLayer({
    refs: [discoverRef, discoverTriggerRef],
    enabled: discoverOpen,
    onDismiss: () => setDiscoverOpen(false),
    restoreFocusRef: discoverTriggerRef,
  });
  useDismissibleLayer({
    refs: [placeCardRef],
    enabled: Boolean(selectedPlace) && placeCardOpen && !discoverOpen,
    onDismiss: () => setPlaceCardOpen(false),
  });

  useEffect(() => {
    if (!playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      if (stop >= leg.stops.length - 1) {
        setPlaying(false);
        return;
      }
      setStop((current) => current + 1);
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [playing, stop, leg.stops.length]);

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "[]") as string[];
      setSaved(list.includes(`${journey.id}:${leg.id}`));
    } catch {
      setSaved(false);
    }
  }, [journey.id, leg.id]);

  useEffect(() => {
    setMounted(true);
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);




  const selectPlace = (place: string | null) => {
    setPlaying(false);
    setVerseOpen(false);
    if (place) {
      setDiscoverOpen(false);
      setPlaceCardOpen(true);
    }
    updateSearch({ place: place ?? undefined });
  };

  const selectJourney = (id: string) => {
    trackNav("journey_selected", { book: JOURNEYS.find(j => j.id === id)?.read.book });
    const next = JOURNEYS.find((item) => item.id === id) ?? JOURNEYS[0];
    setPlaying(false);
    setVerseOpen(false);
    setLocationOpen(true);
    if (onJourneyChange) {
      onJourneyChange(next.id);
      return;
    }
    setJourneyId(next.id);
    setLegId(next.legs[0].id);
    setStop(0);
    updateSearch({ journey: next.id, leg: undefined, stop: undefined, place: undefined });
  };

  const selectLeg = (id: string) => {
    setLegId(id);
    setStop(0);
    setPlaying(false);
    updateSearch({ leg: id, stop: undefined });
  };

  const selectStop = (index: number) => {
    trackNav("journey_stop_selected", { book: journey.read.book, chapter: journey.read.chapter, verse: index });
    const next = Math.min(Math.max(index, 0), leg.stops.length - 1);
    setStop(next);
    setPlaying(false);
    setVerseOpen(false);
    updateSearch({ stop: next || undefined });
  };

  const toggleSaved = () => {
    const key = `${journey.id}:${leg.id}`;
    try {
      const list = JSON.parse(localStorage.getItem(SAVE_KEY) ?? "[]") as string[];
      const next = list.includes(key) ? list.filter((item) => item !== key) : [...list, key];
      localStorage.setItem(SAVE_KEY, JSON.stringify(next));
      setSaved(next.includes(key));
    } catch {
      setSaved(false);
    }
  };

  const shareMap = async () => {
    const done = await nativeShare({ title: `${journey.title} — Bible Atlas`, url: window.location.href });
    if (!done) {
      try {
        await navigator.clipboard?.writeText(window.location.href);
      } catch {
        return;
      }
    }
    setShared(true);
    window.setTimeout(() => setShared(false), 1500);
  };

  const contextTitle = activeFeature?.archaeology
    ? "Archaeological context"
    : activeFeature?.certaintyNote
      ? "Geographic context"
      : active?.extra
        ? "Historical context"
        : "Biblical context";
  const contextBody = activeFeature?.archaeology ?? activeFeature?.certaintyNote ?? active?.extra ?? active?.note;

  return (
    <section aria-label="Interactive Bible map" className="relative h-[calc(100dvh-var(--audio-bar-h,0px))] min-h-[620px] overflow-hidden bg-land">
      <h1 className="sr-only">Interactive Bible Map</h1>
      {useMapbox ? (
        // No `key`: the map instance is reused for every journey, leg and place
        // so a browsing session costs a single map load instead of dozens.
        <MapboxAtlas
          route={selectedPlace ? undefined : { name: leg.name, stops: leg.stops }}
           compare={selectedPlace ? undefined : journey.comparisonRoutes}
          selectedStop={selectedPlace ? null : stop}
          selectedPlace={selectedPlace}
          placeIds={markerPlaceIds}
          onPlaceSelect={selectPlace}
          onFallback={(reason) => {
            markLiveMapFailed(reason);
            setFailReason(reason);
            setMapboxFailed(true);
          }}
          className="h-full"
        />

      ) : !mounted ? (
        // The drawn atlas is ~150 KB of SVG; draw it on the device instead of
        // shipping it in every page's HTML. The route is listed as text below.
        <div className="h-full" aria-hidden="true" />
      ) : (
      <AtlasMap
        key={`${journey.id}-${leg.id}-${selectedPlace ?? "journey"}`}
        interactive={!selectedPlace}
        navigation
        cinematic={!selectedPlace}
        richAtlas
        routeControls={false}
        showLayerControl
        navigationControlsClassName="!left-3 !top-20 sm:!left-5"
        layerControlsClassName="!right-3 !top-20 sm:!right-5"
        placeIds={markerPlaceIds}
        selectedPlace={selectedPlace ?? active?.place}
        selectedStop={selectedPlace ? null : stop}
        onActiveStopChange={selectedPlace ? undefined : setStop}
        onPlaceSelect={selectPlace}
        route={selectedPlace ? undefined : { name: leg.name, stops: leg.stops }}
         compare={selectedPlace ? undefined : journey.comparisonRoutes}
        layers={layers}
        onLayersChange={setLayers}
        className="h-full rounded-none border-0 [&>svg]:h-full [&>svg]:w-full"
      />
      )}

      {mounted && hasMapbox && !useMapbox && (
        <div className="absolute right-3 top-32 z-30 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-end gap-2 sm:right-5" data-map-control>
          <p className="rounded-full border bg-[var(--color-map-chrome)] px-3 py-1 text-[10px] font-medium text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl" role="status">
            {mapboxFailed ? `Live map unavailable — ${fallbackMessage(failReason ?? "")}. Showing offline atlas` : "Offline atlas"}
          </p>
          {mapboxFailed && online && (
            <button
              type="button"
              onClick={() => {
                clearLiveMapFailed();
                setFailReason(null);
                setMapboxFailed(false);
              }}
              className="min-h-9 rounded-full border bg-[var(--color-map-chrome)] px-3 text-xs font-medium text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl hover:opacity-90"
            >
              Try live map again
            </button>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-30" data-map-control>
        <div className="pointer-events-auto absolute left-3 right-3 top-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:left-5 sm:right-5 sm:flex" data-map-padding="top">
          <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] overflow-hidden rounded-lg border bg-[var(--color-map-chrome)] text-[var(--color-map-chrome-foreground)] shadow-xl backdrop-blur-xl sm:w-72">
            <Button ref={discoverTriggerRef} type="button" variant="ghost" size="icon" onClick={() => setDiscoverOpen((open) => !open)} aria-label="Browse maps and places" aria-expanded={discoverOpen} className="h-11 rounded-none border-r"><Compass aria-hidden /></Button>
            <select value={journey.id} onChange={(event) => selectJourney(event.target.value)} aria-label="Choose Bible journey" className="min-w-0 bg-transparent px-3 text-sm font-medium text-foreground outline-none">
              {JOURNEYS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </div>
          <div className="flex shrink-0 gap-2 sm:ml-auto">
            <MapLegend open={legendOpen} onOpenChange={setLegendOpen} />
            <Button asChild variant="outline" size="icon" className="h-11 w-11 rounded-full bg-[var(--color-map-chrome)] text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl">
              {back?.kind === "reader" ? (
                back.verse ? (
                  <Link to={back.lang ? `/${back.lang}/$book/$chapter/$verse` as "/$book/$chapter/$verse" : "/$book/$chapter/$verse"} params={{ book: back.book, chapter: back.chapter, verse: back.verse }}>
                    <ChevronLeft aria-hidden />
                    <span className="sr-only">Back to {back.label}</span>
                  </Link>
                ) : (
                  <Link to={back.lang ? `/${back.lang}/$book/$chapter` as "/$book/$chapter" : "/$book/$chapter"} params={{ book: back.book, chapter: back.chapter }}>
                    <ChevronLeft aria-hidden />
                    <span className="sr-only">Back to {back.label}</span>
                  </Link>
                )
              ) : back?.kind === "place" ? (
                <Link to="/places/$slug" params={{ slug: back.slug }}><ChevronLeft aria-hidden /><span className="sr-only">Back to {back.label}</span></Link>
              ) : back?.kind === "person" ? (
                <Link to="/people/$slug" params={{ slug: back.slug }}><ChevronLeft aria-hidden /><span className="sr-only">Back to {back.label}</span></Link>
              ) : back?.kind === "section" ? (
                <Link to={back.path}><ChevronLeft aria-hidden /><span className="sr-only">Back to {back.label}</span></Link>
              ) : initialJourney ? (
                <Link to="/journeys"><ChevronLeft aria-hidden /><span className="sr-only">Back to all journeys</span></Link>
              ) : (
                <Link to="/"><ChevronLeft aria-hidden /><span className="sr-only">Back to Bible</span></Link>
              )}
            </Button>
            {hasMapbox && <OfflineMapControl placeId={selectedPlace} onAvailability={setOfflineAvailable} />}
            <Button type="button" size="icon" variant="outline" onClick={() => void shareMap()} aria-label="Share map" className="rounded-full bg-[var(--color-map-chrome)] text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl">{shared ? <Check aria-hidden /> : <Share2 aria-hidden />}</Button>

            <Button type="button" size="icon" variant={saved ? "default" : "outline"} onClick={toggleSaved} aria-label={saved ? "Remove saved journey" : "Save journey"} aria-pressed={saved} className="rounded-full shadow-lg backdrop-blur-xl"><Save aria-hidden /></Button>
          </div>
        </div>

        {discoverOpen && (
          
          <aside ref={discoverRef} className="pointer-events-auto absolute left-3 top-16 max-h-[calc(100%-12rem)] w-[min(22rem,calc(100%-1.5rem))] overflow-y-auto rounded-lg border bg-card/95 p-3 shadow-2xl backdrop-blur-xl sm:left-5 sm:top-16">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Nazareth, Paul, Abraham..."
                aria-label="Search biblical maps"
                className="h-11 w-full rounded-lg border bg-background pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {query && <Button type="button" variant="ghost" size="icon" aria-label="Clear map search" onClick={() => setQuery("")} className="absolute right-1 top-1 h-9 w-9"><X aria-hidden /></Button>}
              {query.trim() && (
                <div className="absolute left-0 right-0 top-12 z-10 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1 shadow-xl">
                  {results.features.map((feature) => (
                    <Button key={feature.id} type="button" variant="ghost" onClick={() => { selectPlace(feature.id); setQuery(""); setDiscoverOpen(false); }} className="h-auto min-h-11 w-full justify-between whitespace-normal px-3 text-left text-sm">
                      <span><span className="block text-foreground">{feature.name}</span><span className="block text-[10px] text-muted-foreground">{feature.modernName ?? feature.region ?? feature.kind}</span></span><MapPin className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  ))}
                  {results.journeys.map((journey) => (
                    <Button key={journey.id} type="button" variant="ghost" onClick={() => { selectJourney(journey.id); setQuery(""); setDiscoverOpen(false); }} className="min-h-11 w-full justify-between px-3 text-sm">{journey.title}<ArrowRight className="h-3.5 w-3.5" aria-hidden /></Button>
                  ))}
                  {results.features.length === 0 && results.journeys.length === 0 && <p className="px-3 py-4 text-xs text-muted-foreground">No mapped place or journey matches that search.</p>}
                </div>
              )}
            </div>

            {!query.trim() && (
              <div className="mt-4">
                <h2 className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Journeys by Era</h2>
                <div className="space-y-4">
                  {Object.entries(journeyCategories).map(([cat, journeys]) => (
                    <div key={cat} className="space-y-1">
                      <h3 className="px-1 text-[11px] font-medium text-primary">{cat}</h3>
                      {journeys.map(j => (
                        <Button
                          key={j.id}
                          type="button"
                          variant={journeyId === j.id ? "secondary" : "ghost"}
                          onClick={() => { selectJourney(j.id); setDiscoverOpen(false); }}
                          className="h-auto min-h-10 w-full justify-start whitespace-normal px-2 text-left text-xs"
                        >
                          <span className="block w-full">
                            <span className="block font-medium text-foreground">{j.title}</span>
                            <span className="block truncate text-[10px] text-muted-foreground">{j.tagline}</span>
                          </span>
                        </Button>
                      ))}
                    </div>
                  ))}
                </div>

                <h2 className="mt-6 px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Places</h2>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map(({ label, icon: Icon }) => (
                    <Button key={label} type="button" size="sm" variant={category === label ? "default" : "outline"} onClick={() => setCategory(label)} className="shrink-0 text-[10px]">
                      <Icon className="h-3 w-3" /> {label}
                    </Button>
                  ))}
                </div>
                <div className="mt-2 space-y-1 border-t pt-2">
                  {categoryFeatures.slice(0, 8).map((feature) => (
                    <Button key={feature.id} type="button" variant="ghost" onClick={() => { selectPlace(feature.id); setDiscoverOpen(false); }} className="h-auto min-h-10 w-full justify-between whitespace-normal px-2 text-left text-xs">
                      <span><span className="block text-foreground">{feature.name}</span><span className="block text-[10px] text-muted-foreground">{feature.modernName ?? feature.region}</span></span><ArrowRight className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </aside>

        )}

        {!discoverOpen && (selectedPlace && placeCardOpen ? (
          <aside ref={placeCardRef} className="pointer-events-auto absolute bottom-28 left-3 max-h-[min(54vh,34rem)] w-[min(22rem,calc(100%-1.5rem))] overflow-y-auto rounded-lg border bg-card/95 shadow-2xl backdrop-blur-xl sm:bottom-32 sm:left-5">
            <Button type="button" size="icon" variant="ghost" onClick={() => setPlaceCardOpen(false)} aria-label={`Minimize place details for ${MAP_FEATURE_BY_ID[selectedPlace]?.name ?? "the selected place"}`} className="absolute right-2 top-2 z-10 h-11 w-11 rounded-full"><X aria-hidden /></Button>
            <MapPlaceCard placeId={selectedPlace} onSelect={selectPlace} />
          </aside>
        ) : selectedPlace ? (
          <Button type="button" variant="outline" aria-label={`Open details for ${MAP_FEATURE_BY_ID[selectedPlace]?.name ?? "selected place"}`} onClick={() => setPlaceCardOpen(true)} className="pointer-events-auto absolute bottom-32 left-3 min-h-11 bg-card/95 shadow-lg backdrop-blur-xl sm:left-5 md:bottom-28"><MapPin aria-hidden />{MAP_FEATURE_BY_ID[selectedPlace]?.name ?? "Place details"}</Button>
        ) : (
          <>
            {locationOpen && active && activePlace && (
              <article className="animate-fade-in pointer-events-auto absolute bottom-32 left-3 max-h-[min(42vh,24rem)] w-[min(19rem,calc(100%-4.5rem))] overflow-y-auto rounded-lg border bg-[var(--color-map-chrome)] p-4 text-[var(--color-map-chrome-foreground)] shadow-2xl backdrop-blur-xl sm:bottom-32 sm:left-5 md:bottom-28 md:w-72" data-map-padding="bottom">
                <Button type="button" size="icon" variant="ghost" onClick={() => setLocationOpen(false)} aria-label={`Minimize location card for ${active.label ?? activePlace.name}`} className="absolute right-2 top-2 rounded-full"><X aria-hidden /></Button>
                <p className="text-[10px] font-semibold uppercase text-primary">Stop {stop + 1} of {leg.stops.length}</p>
                <h2 className="scripture mt-1 pr-8 text-2xl text-foreground">{active.label ?? activePlace.name}</h2>
                {(activeFeature?.modernName || activeFeature?.region) && <p className="mt-0.5 text-xs text-muted-foreground">{activeFeature.modernName ?? activeFeature.region}</p>}
                <p className="mt-3 text-sm leading-relaxed text-foreground/90">{active.note}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                  <div><dt className="text-muted-foreground">Distance travelled</dt><dd className="mt-0.5 font-medium text-foreground">approx. {Math.round(travelled).toLocaleString()} km</dd></div>
                  <div><dt className="text-muted-foreground">Travel estimate</dt><dd className="mt-0.5 font-medium text-foreground">{mixedTravelEstimate(leg.stops, stop, leg.bySea)}</dd></div>
                </dl>
                {activeFeature && <p className="mt-3 text-[10px] text-muted-foreground">{certaintyLabel(activeFeature.certainty)} · {accuracyLabel.toLowerCase()} along known terrain and travel corridors</p>}
                {active.ref && <Button type="button" variant="link" onClick={() => setVerseOpen(true)} className="mt-2 px-0"><BookOpen aria-hidden />{active.ref}</Button>}

                {active && NODE_BY_ENTRY[active.place] && (
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full gap-2">
                    <Link to="/connections/$node" params={{ node: NODE_BY_ENTRY[active.place].id }} search={{ from: `/journeys/${journey.id}` }}>
                      <Network className="h-3.5 w-3.5" /> See connections
                    </Link>
                  </Button>
                )}

              </article>
            )}

            {!locationOpen && active && activePlace && (
              <Button type="button" variant="outline" onClick={() => setLocationOpen(true)} className="pointer-events-auto absolute bottom-32 left-3 bg-card/95 shadow-lg backdrop-blur-xl sm:left-5 md:bottom-28"><MapPin aria-hidden />{active.label ?? activePlace.name}</Button>
            )}

            <aside className="animate-fade-in pointer-events-auto absolute bottom-28 right-5 hidden w-72 rounded-lg border bg-[var(--color-map-chrome)] p-4 text-[var(--color-map-chrome-foreground)] shadow-2xl backdrop-blur-xl lg:block">
              <p className="text-[10px] font-semibold uppercase text-primary">{contextTitle}</p>
              <h2 className="scripture mt-1 text-lg text-foreground">Why this place matters</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{contextBody}</p>
            </aside>

            {verseOpen && active.ref && passageLink && (
              <article className="animate-scale-in pointer-events-auto absolute bottom-32 left-1/2 w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-lg border bg-card/95 p-4 shadow-2xl backdrop-blur-xl sm:bottom-32 md:bottom-28">
                <Button type="button" size="icon" variant="ghost" onClick={() => setVerseOpen(false)} aria-label="Close Scripture card" className="absolute right-2 top-2 rounded-full"><X aria-hidden /></Button>
                <p className="text-[10px] font-semibold uppercase text-primary">Scripture at this stop</p>
                <h2 className="scripture mt-1 text-xl text-foreground">{active.ref}</h2>
                {passageVerse ? <p className="mt-2 pr-6 text-sm leading-relaxed text-muted-foreground">“{passageVerse.text.trim()}”</p> : passageQuery.isLoading ? <StateMessage kind="loading" title="Loading the passage…" compact className="mt-3" /> : <p className="mt-2 pr-6 text-sm leading-relaxed text-muted-foreground">{active.note}</p>}
                <Button asChild size="sm" className="mt-4">
                  {passageLink.verse ? (
                    <Link to="/$book/$chapter/$verse" params={{ book: passageLink.book, chapter: String(passageLink.chapter), verse: String(passageLink.verse) }}>Read in context<BookOpen aria-hidden /></Link>
                  ) : (
                    <Link to="/$book/$chapter" params={{ book: passageLink.book, chapter: String(passageLink.chapter) }}>Read in context<BookOpen aria-hidden /></Link>
                  )}
                </Button>
              </article>
            )}

            <div className="pointer-events-auto absolute inset-x-2 bottom-2 rounded-lg border bg-[var(--color-map-chrome)] px-3 py-3 text-[var(--color-map-chrome-foreground)] shadow-2xl backdrop-blur-xl sm:inset-x-5 sm:bottom-4 sm:px-4" data-map-padding="bottom">
              <div className="flex items-center gap-1 sm:gap-2">
                <Button type="button" size="icon" onClick={() => { if (stop >= leg.stops.length - 1) setStop(0); setPlaying((value) => !value); }} aria-label={playing ? "Pause story" : "Play story"} className="shrink-0 rounded-full">{playing ? <Pause aria-hidden /> : <Play aria-hidden />}</Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => selectStop(0)} disabled={stop === 0} aria-label="Restart journey" className="shrink-0"><RotateCcw aria-hidden /></Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => selectStop(stop - 1)} disabled={stop === 0} aria-label="Previous stop" className="shrink-0"><ChevronLeft aria-hidden /></Button>
                <div className="min-w-0 flex-1">
                  <input type="range" min={0} max={Math.max(leg.stops.length - 1, 0)} step={1} value={stop} onChange={(event) => selectStop(Number(event.target.value))} className="h-1 w-full cursor-pointer accent-[var(--color-route)]" aria-label="Journey stage" aria-valuetext={`${active?.label ?? activePlace?.name}, stop ${stop + 1} of ${leg.stops.length}`} />
                  <div className="mt-1.5 hidden justify-between gap-1 overflow-hidden sm:flex">
                    {leg.stops.map((item, index) => <Button key={`${item.place}-${index}`} type="button" variant="ghost" onClick={() => selectStop(index)} className={`h-auto min-w-0 flex-1 truncate px-0 py-0 text-[9px] ${index === stop ? "font-semibold text-foreground" : "text-muted-foreground"}`} aria-current={index === stop ? "step" : undefined}>{item.label ?? PLACES[item.place]?.name}</Button>)}
                  </div>
                </div>
                <Button type="button" size="icon" variant="ghost" onClick={() => selectStop(stop + 1)} disabled={stop === leg.stops.length - 1} aria-label="Next stop" className="shrink-0"><ChevronRight aria-hidden /></Button>
              </div>
              <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t pt-2 text-[10px] text-muted-foreground sm:flex sm:justify-between">
                <span className="truncate">{Math.round(travelled).toLocaleString()} of {Math.round(total).toLocaleString()} km · {leg.short}</span>
                {journey.legs.length > 1 && <select value={leg.id} onChange={(event) => selectLeg(event.target.value)} aria-label="Choose journey leg" className="max-w-44 rounded-md border bg-background px-2 py-1 text-foreground">{journey.legs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
              </div>
               {journey.comparisonRoutes?.length ? (
                 <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-[10px] text-muted-foreground" aria-label="Route comparison">
                   <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded bg-[var(--color-map-route-past)]" />Jesus through Samaria</span>
                   <span className="inline-flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-[var(--color-map-route-comparison)]" />Discussed alternative via Jordan Valley / Perea</span>
                   <span className="basis-full">John records Jesus’ route; the eastern alternative is a debated historical reconstruction.</span>
                 </div>
               ) : null}
            </div>
          </>
        ))}
      </div>
      <LiveStatus>{shared ? "Map link copied" : saved ? "Journey saved" : ""}</LiveStatus>
    </section>
  );
}