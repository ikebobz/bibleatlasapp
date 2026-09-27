/**
 * Offline map control for /maps.
 *
 * Owns the whole save lifecycle and reports only what storage can prove:
 * a map is shown as saved after its pieces have been read back successfully.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Download, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";
import { PLACES } from "@/lib/atlas/geo";
import {
  BIBLE_LANDS,
  formatSavedAt,
  formatTileBytes,
  offlineMapsSupported,
  refreshArea,
  removeArea,
  saveArea,
  savedAreas,
  type AreaSpec,
  type SavePhase,
  type SavedArea,
} from "@/lib/atlas/tile-cache";

type Props = {
  /** Currently opened place, so its own close-up area can be saved too. */
  placeId?: string | null;
  /** Reports verified offline availability so the map can run without a network. */
  onAvailability?: (available: boolean) => void;
};

const PHASE_LABEL: Record<SavePhase, string> = {
  preparing: "Preparing map…",
  downloading: "Downloading map",
  finalizing: "Finishing download…",
  verifying: "Verifying offline map…",
};

/** Close-up area around a single place. */
function placeArea(placeId: string): AreaSpec | null {
  const place = PLACES[placeId];
  if (!place) return null;
  const pad = 1.2;
  return {
    id: `place:${place.id}`,
    label: place.name,
    bounds: [place.lon - pad, place.lat - pad, place.lon + pad, place.lat + pad],
    zooms: [7, 8, 9, 10],
  };
}

export function OfflineMapControl({ placeId, onAvailability }: Props) {
  const [areas, setAreas] = useState<SavedArea[]>([]);
  const [progress, setProgress] = useState<{ id: string; phase: SavePhase; percent: number } | null>(null);
  const [failure, setFailure] = useState<{ id: string; reason: string } | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listTriggerRef = useRef<HTMLButtonElement>(null);
  // Storage is what makes a save possible; the worker is what lets the map read
  // it back while offline, so the two are reported separately and honestly.
  // Decided after mount so the server and first client render agree.
  const [canStore, setCanStore] = useState(true);
  useEffect(() => setCanStore(typeof caches !== "undefined"), []);
  const servedOffline = typeof window !== "undefined" && offlineMapsSupported();

  const target = useMemo(() => (placeId ? placeArea(placeId) ?? BIBLE_LANDS : BIBLE_LANDS), [placeId]);
  const record = areas.find((area) => area.id === target.id);
  const busy = progress?.id === target.id;
  const failed = failure?.id === target.id;
  const savedHere = record?.state === "saved";

  useDismissibleLayer({
    refs: [listRef, listTriggerRef],
    enabled: listOpen,
    onDismiss: () => setListOpen(false),
    restoreFocusRef: listTriggerRef,
  });

  /* Persisted state is the source of truth, re-verified on every mount so a
     record left behind by an eviction never claims the map is available. */
  const load = useCallback(async () => {
    const stored = await savedAreas();
    const checked = await Promise.all(stored.map((area) => (area.state === "saved" ? refreshArea(area) : area)));
    setAreas(checked);
    onAvailability?.(checked.some((area) => area.state === "saved"));
  }, [onAvailability]);

  useEffect(() => {
    void load();
  }, [load]);

  const start = async () => {
    if (busy) {
      abortRef.current?.abort();
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setFailure(null);
    setProgress({ id: target.id, phase: "preparing", percent: 0 });
    try {
      const result = await saveArea(
        target,
        ({ phase, stored, required }) =>
          setProgress({ id: target.id, phase, percent: required ? Math.floor((stored / required) * 100) : 0 }),
        controller.signal,
      );
      if (result.state !== "saved") setFailure({ id: target.id, reason: result.reason ?? "Download failed" });
    } catch (error) {
      setFailure({ id: target.id, reason: (error as Error)?.message ?? "Download failed" });
    } finally {
      abortRef.current = null;
      setProgress(null);
      await load();
    }
  };

  const remove = async (id: string) => {
    await removeArea(id);
    await load();
  };

  if (!canStore) {
    return (
      <div
        className="pointer-events-auto rounded-full border bg-[var(--color-map-chrome)] px-3 py-2 text-[11px] text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl"
        role="note"
      >
        Offline maps are not available in this browser
      </div>
    );
  }

  const label = busy
    ? progress.phase === "downloading"
      ? `Downloading ${progress.percent}%`
      : PHASE_LABEL[progress.phase]
    : failed
      ? "Download failed · Retry"
      : savedHere
        ? "Saved Offline"
        : `Save ${target.id === BIBLE_LANDS.id ? "Map" : target.label}`;

  return (
    <div className="pointer-events-auto relative flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant={savedHere ? "default" : failed ? "destructive" : "outline"}
        onClick={() => void start()}
        aria-label={busy ? "Stop saving the map" : savedHere ? "Map saved for offline use" : label}
        aria-live="polite"
        data-testid="offline-map-button"
        data-state={busy ? progress.phase : failed ? "failed" : savedHere ? "saved" : "idle"}
        title={
          savedHere && record
            ? `${record.label} · ${formatTileBytes(record.bytes)} · ${formatSavedAt(record.savedAt)}`
            : failed
              ? failure.reason
              : label
        }
        className="min-h-11 gap-2 rounded-full bg-[var(--color-map-chrome)] px-3 text-xs text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : failed ? (
          <AlertTriangle className="h-4 w-4" aria-hidden />
        ) : savedHere ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Download className="h-4 w-4" aria-hidden />
        )}
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{busy ? `${progress.percent}%` : savedHere ? "Saved" : failed ? "Retry" : "Save"}</span>
      </Button>

      {areas.length > 0 && (
        <Button
          ref={listTriggerRef}
          type="button"
          size="sm"
          variant="outline"
          aria-expanded={listOpen}
          onClick={() => setListOpen((open) => !open)}
          className="min-h-11 rounded-full bg-[var(--color-map-chrome)] px-3 text-xs text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl"
        >
          Saved maps
        </Button>
      )}

      {listOpen && (
        <div
          ref={listRef}
          className="absolute right-0 top-12 z-20 w-[min(20rem,calc(100vw-2rem))] rounded-lg border bg-card/95 p-2 text-left shadow-2xl backdrop-blur-xl"
        >
          <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Saved maps</p>
          {!servedOffline && (
            <p className="px-1 pb-2 text-[11px] text-muted-foreground">
              Saved maps are used without a connection once the app is installed on this device.
            </p>
          )}
          <ul className="space-y-1">
            {areas.map((area) => (
              <li key={area.id} className="flex items-start justify-between gap-2 rounded-md p-2 hover:bg-muted/60">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{area.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {area.state === "saved" ? "Available offline" : area.reason ?? "Incomplete"} · {formatTileBytes(area.bytes)}
                    {area.savedAt ? ` · ${formatSavedAt(area.savedAt)}` : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove saved map for ${area.label}`}
                  onClick={() => void remove(area.id)}
                  className="h-9 w-9 shrink-0"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
