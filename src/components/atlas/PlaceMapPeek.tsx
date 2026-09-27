import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAP_FEATURE_BY_ID, isApproximate } from "@/lib/atlas/catalogue";
import { PLACES } from "@/lib/atlas/geo";
import { hasMapbox } from "@/lib/atlas/mapbox";
import { liveMapFailedThisSession, markLiveMapFailed } from "@/lib/atlas/map-debug";
import { AtlasMap } from "./AtlasMap";
import { MapboxAtlas } from "./MapboxAtlas";

export function PlaceMapPeek({ placeId, from, onClose }: { placeId: string; from: string; onClose: () => void }) {
  const place = MAP_FEATURE_BY_ID[placeId];
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(liveMapFailedThisSession);
  const [elevation, setElevation] = useState<number | null>(null);
  const [online, setOnline] = useState(false);
  const liveStarted = useRef(false);
  const gesture = useRef<number | null>(null);
  useEffect(() => {
    setOnline(navigator.onLine);
    const onNetwork = () => setOnline(navigator.onLine);
    window.addEventListener("online", onNetwork);
    window.addEventListener("offline", onNetwork);
    return () => { window.removeEventListener("online", onNetwork); window.removeEventListener("offline", onNetwork); };
  }, []);
  if (!place) return null;
  const focusPlaceIds = place.kind === "region" ? [placeId, ...place.relatedPlaceIds.filter((id) => PLACES[id]).slice(0, 4)] : [placeId];
  const biblicalNote = place.passages[0]?.reference;
  const useLiveMap = (online || liveStarted.current) && hasMapbox && !failed;
  if (useLiveMap) liveStarted.current = true;
  return (
    <div className={(expanded ? "h-[100dvh] " : "h-[54dvh] min-h-[320px] ") + "flex min-h-0 flex-col bg-background transition-[height] duration-300 motion-reduce:transition-none"}>
      <div className="touch-none px-4 pt-2" onTouchStart={(e) => { gesture.current = e.touches[0]?.clientY ?? null; }} onTouchEnd={(e) => {
        if (gesture.current === null) return;
        const delta = (e.changedTouches[0]?.clientY ?? gesture.current) - gesture.current;
        gesture.current = null;
        if (delta < -55) setExpanded(true);
        if (delta > 55) { if (expanded) setExpanded(false); else onClose(); }
      }}>
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/40" aria-hidden />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 pb-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase text-muted-foreground">Place in Scripture</p>
            <h2 className="scripture truncate text-xl text-foreground">{place.name}</h2>
          </div>
          <div className="flex shrink-0 items-center">
            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Collapse map" : "Expand map"}>{expanded ? <ChevronDown /> : <ChevronUp />}</Button>
            <Button variant="ghost" size="icon" className="h-11 w-11" onClick={onClose} aria-label="Close map"><X /></Button>
          </div>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden bg-land" aria-label={`Map of ${place.name}`}>
        {useLiveMap ? (
          <MapboxAtlas selectedPlace={placeId} placeIds={focusPlaceIds} compact onFallback={(reason) => { markLiveMapFailed(reason); setFailed(true); }} onElevation={setElevation} className="h-full" />
        ) : (
          <AtlasMap placeIds={focusPlaceIds} selectedPlace={placeId} navigation interactive richAtlas controls={false} className="h-full [&>svg]:h-full [&>svg]:w-full" />
        )}
      </div>
      <div className="border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="line-clamp-1 text-sm text-foreground">{place.summary ?? place.certaintyNote ?? `${place.name} in biblical geography.`}{biblicalNote ? ` · ${biblicalNote}` : ""}</p>
        <p className="mt-1 text-xs text-muted-foreground">{isApproximate(place.certainty) ? "Approximate location · " : ""}{elevation === null ? "Elevation unavailable" : `Elevation ${elevation.toLocaleString()} m`}</p>
        <Link to="/maps" search={{ place: placeId, ...(from ? { from } : {}) }} className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary">Explore full map <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}
