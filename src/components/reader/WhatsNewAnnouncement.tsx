import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import { trackNav } from "@/lib/analytics/nav-events";
import { useAfterInteraction } from "@/lib/use-after-interaction";
import { useWhatsNew } from "@/lib/whats-new";

const KEY = "bible-atlas:announce-2.6.0";

/**
 * One-time, non-blocking announcement of the Audio Bible. It appears
 * only for returning readers who haven't acknowledged it, and never again once
 * dismissed or acted on.
 */
export function WhatsNewAnnouncement() {
  const { ready, isFirstVisit } = useWhatsNew();
  // Only after the reader engages: inserting it sooner would push Scripture down.
  const engaged = useAfterInteraction();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ready || isFirstVisit || !engaged) return;
    try {
      if (localStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    setShow(true);
    trackNav("whats_new_shown");
  }, [ready, isFirstVisit, engaged]);

  const acknowledge = () => {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      aria-label="New in Bible Atlas"
      className="mx-4 mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 motion-safe:animate-in motion-safe:fade-in"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">New in Bible Atlas</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
            Audio now follows your translation: full-Bible narration on the NIV, a dramatized New
            Testament on the WEB, and headphone badges in the version picker. Press play in the
            bottom player, and Autoplay carries you into the next chapter.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              to="/whats-new"
              onClick={() => {
                trackNav("whats_new_cta_clicked");
                acknowledge();
              }}
              className="inline-flex min-h-9 items-center rounded-full bg-primary px-3.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              See what's new
            </Link>

            <button
              type="button"
              onClick={() => {
                trackNav("whats_new_dismissed");
                acknowledge();
              }}
              className="inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs text-foreground transition-colors hover:bg-muted"
            >
              Maybe later
            </button>
            <Link
              to="/whats-new"
              className="text-xs text-primary hover:underline"
              onClick={acknowledge}
            >
              Full release notes
            </Link>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            trackNav("whats_new_dismissed");
            acknowledge();
          }}
          aria-label="Dismiss announcement"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
}
