import { Check, CloudDownload, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  TOTAL_KJV_CHAPTERS,
  deleteKjv,
  estimateBytes,
  formatBytes,
  pauseDownload,
  startDownload,
} from "@/lib/offline/kjv-download";
import { storedChapterCounts } from "@/lib/offline/chapter-store";
import { useKjvDownload } from "@/lib/offline/useKjvDownload";
import { useSettings } from "../settings";
import { getTranslation } from "@/lib/translations";
import { useOfflineLibrary } from "./offline-context";

const WIFI_KEY = "bible-atlas:kjv-wifi-only";

const TOTAL = TOTAL_KJV_CHAPTERS;

/**
 * Every version with text on this device, so it's obvious what is actually
 * saved, how complete it is, and how to remove it.
 */
function StoredVersions() {
  const { refreshStored } = useOfflineLibrary();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = () => {
    void storedChapterCounts().then(setCounts);
  };
  useEffect(load, []);

  const rows = Object.entries(counts).filter(([, n]) => n > 0);
  if (!rows.length) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-foreground">On this device</p>
      {rows.map(([id, n]) => (
        <div key={id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
          <span className="text-foreground">{getTranslation(id).label}</span>
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {n >= TOTAL ? "Downloaded" : `Partial · ${n}/${TOTAL}`}
            </span>
            <button
              type="button"
              aria-label={`Delete ${getTranslation(id).label} from this device`}
              onClick={() => {
                void deleteKjv(id as never).then(() => {
                  load();
                  refreshStored();
                });
              }}
              className="text-destructive transition-colors hover:opacity-80"
            >
              <Trash2 aria-hidden className="h-3 w-3" />
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}

function formatEta(seconds: number | null) {
  if (!seconds || seconds <= 0) return null;
  if (seconds < 60) return `${seconds}s left`;
  return `${Math.round(seconds / 60)} min left`;
}

/** Settings → Offline Bible: download, progress, storage and removal. */
export function OfflineBibleSection() {
  const { translation } = useSettings();
  const version = getTranslation(translation);
  const state = useKjvDownload(version.id);
  const { online, refreshStored } = useOfflineLibrary();
  const [wifiOnly, setWifiOnly] = useState(false);

  useEffect(() => {
    try {
      setWifiOnly(localStorage.getItem(WIFI_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (state.phase === "complete") refreshStored();
  }, [state.phase, refreshStored]);

  const downloading = state.phase === "downloading";
  const complete = state.phase === "complete";
  const pct = Math.min(100, Math.round((state.chapters / TOTAL_KJV_CHAPTERS) * 100));
  const eta = formatEta(state.eta);

  const toggleWifi = () => {
    const next = !wifiOnly;
    setWifiOnly(next);
    try {
      localStorage.setItem(WIFI_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const onDemand = () => {
    if (wifiOnly && typeof navigator !== "undefined") {
      const conn = (navigator as unknown as { connection?: { type?: string; effectiveType?: string } })
        .connection;
      if (conn?.type && conn.type !== "wifi" && conn.type !== "ethernet") return;
    }
    void startDownload(version.id);
  };

  if (version.displayOnly) {
    return (
      <div className="space-y-2 border-t pt-3">
        <p className="text-xs font-semibold text-foreground">Offline Bible</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {version.name} is a licensed text, so it can’t be saved on this device. Switch to a
          public-domain version such as KJV or WEB to download it for offline reading.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-xs font-semibold text-foreground">Offline Bible</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {version.name} — download it once to read, navigate and search with no connection. Each
        version is stored separately; nothing downloads on its own.
      </p>


      {complete ? (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-foreground">
            <Check className="h-3.5 w-3.5 text-primary" /> {version.label} saved on this device
          </span>
          <span className="text-muted-foreground">{formatBytes(state.bytes)}</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onDemand}
          disabled={downloading || !online}
          className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-1.5 text-foreground">
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : state.chapters > 0 ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <CloudDownload className="h-3.5 w-3.5" />
            )}
            {downloading
              ? `Downloading ${version.label}…`
              : state.chapters > 0
                ? `Resume ${version.label} download`
                : `Download ${version.label}`}
          </span>
          <span className="text-muted-foreground">
            {downloading ? `${pct}%` : `~${formatBytes(estimateBytes(state))}`}
          </span>
        </button>
      )}

      {(downloading || (state.chapters > 0 && !complete)) && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {state.chapters}/{TOTAL_KJV_CHAPTERS} chapters · {formatBytes(state.bytes)}
            </span>
            {eta && <span>{eta}</span>}
          </div>
          {downloading && (
            <button
              type="button"
              onClick={() => pauseDownload(version.id)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] text-muted-foreground"
            >
              <Pause className="h-3 w-3" /> Pause
            </button>
          )}
        </div>
      )}

      {state.phase === "error" && (
        <p className="text-[11px] text-destructive">
          The download stopped. Tap resume to pick up where it left off.
        </p>
      )}

      <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
        <span className="text-foreground">Storage used</span>
        <span className="text-muted-foreground">{formatBytes(state.bytes)}</span>
      </div>

      <StoredVersions />



      <button
        type="button"
        onClick={toggleWifi}
        className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs"
      >
        <span className="text-foreground">Download over Wi‑Fi only</span>
        <span className={wifiOnly ? "text-primary" : "text-muted-foreground"}>
          {wifiOnly ? "On" : "Off"}
        </span>
      </button>

      {state.chapters > 0 && (
        <button
          type="button"
          onClick={() => {
            void deleteKjv(version.id).then(refreshStored);
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] text-destructive transition-colors hover:bg-muted"
        >
          <Trash2 className="h-3 w-3" /> Delete {version.label} from this device
        </button>
      )}
    </div>
  );
}
