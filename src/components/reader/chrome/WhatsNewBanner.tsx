import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { useEffect } from "react";

import { useAfterInteraction } from "@/lib/use-after-interaction";
import { useWhatsNew } from "@/lib/whats-new";
import { trackBannerImpressionOnce, trackWhatsNew } from "@/lib/analytics/whats-new-events";

/** Compact header icon linking to the release notes. */
export function WhatsNewButton() {
  const { lastSeen, unseenCount } = useWhatsNew();
  return (
    <Link
      to="/whats-new"
      onClick={() => trackWhatsNew("nav_click", { lastSeen, unseenCount })}
      aria-label={unseenCount > 0 ? `What's new (${unseenCount} new features)` : "What's new"}
      title="What's new"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
    >
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      {unseenCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
      )}
    </Link>
  );
}

export function WhatsNewNavLink({ onNavigate }: { onNavigate?: () => void }) {
  const { lastSeen, unseenCount } = useWhatsNew();
  return (
    <Link
      to="/whats-new"
      onClick={() => {
        trackWhatsNew("nav_click", { lastSeen, unseenCount });
        onNavigate?.();
      }}
      className="flex w-full items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-xs text-foreground transition-colors hover:bg-primary/10"
    >
      <Sparkles className="h-3.5 w-3.5 text-primary" />
      What's new
      {unseenCount > 0 && (
        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
          {unseenCount}
        </span>
      )}
    </Link>
  );
}

/** Slim banner telling returning readers what has shipped since their last visit. */
export function WhatsNewBanner() {
  const { ready, lastSeen, unseenCount, bannerDismissed, dismissBanner } = useWhatsNew();
  // Hold the banner back until the reader engages, so Scripture never jumps.
  const engaged = useAfterInteraction();
  const visible = ready && engaged && !bannerDismissed && unseenCount > 0;

  useEffect(() => {
    if (visible) trackBannerImpressionOnce({ lastSeen, unseenCount });
  }, [visible, lastSeen, unseenCount]);

  if (!visible) return null;

  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
      <Sparkles className="h-4 w-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-[13px] text-foreground">
        {unseenCount} new feature{unseenCount === 1 ? "" : "s"} since your last visit.{" "}
        <Link
          to="/whats-new"
          onClick={() => trackWhatsNew("banner_click", { lastSeen, unseenCount })}
          className="font-medium text-primary hover:underline"
        >
          See what's new
        </Link>
      </p>
      <button
        type="button"
        onClick={() => {
          trackWhatsNew("banner_dismiss", { lastSeen, unseenCount });
          dismissBanner();
        }}
        aria-label="Dismiss what's new"
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
