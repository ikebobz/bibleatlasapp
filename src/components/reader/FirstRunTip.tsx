import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { usePromptSlot } from "@/components/pwa/PromptCoordinator";

const KEY = "bible-atlas:tour-tip-seen";

/**
 * One-time welcome for first-time readers (and visitors from the landing
 * page). Explains what Bible Atlas is and the one thing that makes the reader
 * different, then gets out of the way forever.
 */
export function FirstRunTip({ fromTour = false }: { fromTour?: boolean }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY)) return;
      // Existing readers (a saved position) never see the welcome.
      if (!fromTour && localStorage.getItem("bible-atlas:position")) return;
    } catch {
      /* storage unavailable — still show once */
    }
    const t = setTimeout(() => setShow(true), 900);
    return () => clearTimeout(t);
  }, [fromTour]);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
  }

  const allowed = usePromptSlot("tip", show);
  if (!allowed) return null;

  return (
    <div
      role="region"
      aria-label="Welcome to Bible Atlas"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[calc(var(--audio-bar-h,0px)+var(--chapter-nav-h,0px)+max(0.75rem,env(safe-area-inset-bottom)))]"
    >
      <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border bg-card px-4 py-3 shadow-lg">
        <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 text-sm text-foreground">
          <p className="font-semibold">Welcome to Bible Atlas</p>
          <p className="mt-1 text-muted-foreground">
            Read Scripture with its world beside it. Tap any{" "}
            <span className="text-primary underline decoration-dotted">highlighted name</span> or
            place for its map, profile and timeline. Tap the chapter name below to jump anywhere.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4">
            <Link to="/journeys" onClick={dismiss} className="inline-flex min-h-11 items-center text-xs font-medium text-primary">
              Explore maps
            </Link>
            <Link to="/about" onClick={dismiss} className="inline-flex min-h-11 items-center text-xs font-medium text-primary">
              What's inside
            </Link>
            <button type="button" onClick={dismiss} className="inline-flex min-h-11 items-center text-xs font-medium text-foreground">
              Start reading
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss welcome"
          className="-mr-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
