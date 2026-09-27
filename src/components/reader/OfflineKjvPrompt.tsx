import { CloudDownload, Gauge, Signal, Timer } from "lucide-react";
import { useEffect, useState } from "react";

import { trackNav } from "@/lib/analytics/nav-events";
import {
  estimateBytes,
  formatBytes,
  hydrate,
  startDownload,
} from "@/lib/offline/kjv-download";
import { useKjvDownload } from "@/lib/offline/useKjvDownload";
import { hasMeaningfulUsage, noteSession } from "@/lib/offline/usage-tracker";
import { usePromptSlot } from "@/components/pwa/PromptCoordinator";

const DISMISS_KEY = "bible-atlas:kjv-prompt-dismissed";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function snoozed() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < SNOOZE_MS;
  } catch {
    return false;
  }
}

/**
 * Invites the reader to keep the whole KJV on the device — but only after
 * they've actually used the app, never on a first session, and never again
 * once it's downloaded.
 */
export function OfflineKjvPrompt() {
  const download = useKjvDownload("kjv");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    noteSession();
    let cancelled = false;
    const timer = setTimeout(() => {
      void hydrate("kjv").then((state) => {
        if (cancelled) return;
        if (state.phase === "complete" || state.phase === "downloading") return;
        if (snoozed() || !hasMeaningfulUsage()) return;
        setVisible(true);
        trackNav("offline_kjv_prompt_shown");
      });
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const allowed = usePromptSlot("offline", visible && download.phase !== "complete");

  if (!allowed) return null;

  const size = formatBytes(estimateBytes(download));
  const downloading = download.phase === "downloading";
  const pct = Math.min(100, Math.round((download.chapters / 1189) * 100));

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    trackNav("offline_kjv_prompt_dismissed");
    setVisible(false);
  };

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(var(--audio-bar-h,0px)+var(--chapter-nav-h,0px)+max(0.75rem,env(safe-area-inset-bottom)))]"
      aria-label="Download the KJV for offline reading"
    >
      <div className="mx-auto max-w-sm rounded-2xl border bg-popover p-5 text-center shadow-2xl">
        <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CloudDownload className="h-6 w-6" />
        </span>
        <p className="text-base font-semibold text-foreground">Read Offline. Save Data.</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Download the King James Version to this device for offline access anytime, anywhere.
        </p>

        <ul className="mx-auto mt-4 space-y-2 text-left text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <Timer className="h-3.5 w-3.5 text-primary" /> Read without internet
          </li>
          <li className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-primary" /> Faster experience
          </li>
          <li className="flex items-center gap-2">
            <Signal className="h-3.5 w-3.5 text-primary" /> Save mobile data
          </li>
          <li className="flex items-center gap-2">
            <CloudDownload className="h-3.5 w-3.5 text-primary" /> Only about {size}
          </li>
        </ul>

        {downloading && (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}

        <button
          type="button"
          onClick={() => void startDownload("kjv")}
          disabled={downloading}
          className="mt-4 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {downloading ? `Downloading… ${pct}%` : "Download KJV"}
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 w-full rounded-full px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
        >
          Maybe later
        </button>
      </div>
    </aside>
  );
}
