import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

import { trackShare } from "@/lib/analytics/share-events";
import { applyUpdate, watchForUpdate } from "@/lib/pwa/update";
import { getSnapshot } from "@/lib/offline/kjv-download";
import { DEFAULT_TRANSLATION } from "@/lib/translations";
import { usePromptSlot } from "./PromptCoordinator";

/**
 * "Update available" toast.
 *
 * Never interrupts reading: the new version simply waits until the user taps
 * Refresh, or until the next cold start. Downloaded Bible text lives in the
 * device database and survives the refresh untouched.
 */
export function UpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => watchForUpdate(setWaiting), []);

  const downloading = waiting ? getSnapshot(DEFAULT_TRANSLATION).phase === "downloading" : false;
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  const requested = Boolean(waiting) && !dismissed && !downloading && !offline;
  const show = usePromptSlot("update", requested);

  useEffect(() => {
    if (show) trackShare("update_prompt_shown", { resourceType: "chapter" });
  }, [show]);

  if (!show || !waiting) return null;

  return (
    <aside
      role="status"
      aria-label="Update available"
      className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-[calc(var(--audio-bar-h,0px)+var(--chapter-nav-h,0px)+max(0.75rem,env(safe-area-inset-bottom)))]"
    >
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-xl border bg-surface-raised p-3 shadow-lg">
        <RefreshCw className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">A new version of Bible Atlas is ready</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your downloaded Bible stays on your device.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            trackShare("update_applied", { resourceType: "chapter" });
            applyUpdate(waiting);
          }}
          className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Refresh now
        </button>
        <button
          type="button"
          aria-label="Later"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
