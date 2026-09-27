import { useCallback, useEffect, useState } from "react";
import {
  PRE_NOTES_VERSION,
  countItems,
  latestVersion,
  releasesSince,
} from "@/lib/release-notes";

export const LAST_SEEN_KEY = "bible-atlas:last-seen-release";
/** Set on first visit so we can tell brand-new devices from returning readers. */
const FIRST_SEEN_KEY = "bible-atlas:first-seen";
const BANNER_DISMISSED_KEY = "bible-atlas:whats-new-dismissed";

/**
 * Keys written by other Bible Atlas features. If any of these exist the device
 * has used the app before the release-notes system shipped, so it must NOT be
 * treated as a brand-new visitor (that would silently suppress every indicator).
 */
const FOOTPRINT_KEYS = [
  "bible-atlas:settings",
  "bible-atlas:position",
  "bible-atlas:highlights",
  "bible-atlas:translation",
  "bible-atlas-push-prefs",
  "bible-atlas-push-time",
];

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function hasPriorFootprint(): boolean {
  try {
    if (FOOTPRINT_KEYS.some((k) => localStorage.getItem(k) !== null)) return true;
    // Any other namespaced key also counts as prior usage.
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k === FIRST_SEEN_KEY || k === LAST_SEEN_KEY || k === BANNER_DISMISSED_KEY) continue;
      if (k.startsWith("bible-atlas")) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export type WhatsNewState = {
  /** True once the client has read localStorage; nothing renders before then. */
  ready: boolean;
  lastSeen: string | null;
  /** Number of new feature entries since the last visit. */
  unseenCount: number;
  /** This device has never used Bible Atlas before — don't nag it. */
  isFirstVisit: boolean;
  /** Banner was dismissed for the current release. */
  bannerDismissed: boolean;
  dismissBanner: () => void;
  markSeen: () => void;
};

export function useWhatsNew(): WhatsNewState {
  const [ready, setReady] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const seen = read(LAST_SEEN_KEY);
    let effective = seen;
    let first = false;

    if (!read(FIRST_SEEN_KEY)) {
      write(FIRST_SEEN_KEY, new Date().toISOString());
      if (seen === null) {
        if (hasPriorFootprint()) {
          // Returning reader from before release notes existed: backdate them so
          // they get the badge and banner once, instead of permanent silence.
          effective = PRE_NOTES_VERSION;
          write(LAST_SEEN_KEY, PRE_NOTES_VERSION);
        } else {
          first = true;
          effective = latestVersion();
          write(LAST_SEEN_KEY, effective);
        }
      }
    }

    setIsFirstVisit(first);
    setLastSeen(effective);
    setBannerDismissed(read(BANNER_DISMISSED_KEY) === latestVersion());
    setReady(true);
  }, []);

  const markSeen = useCallback(() => {
    const version = latestVersion();
    write(LAST_SEEN_KEY, version);
    write(BANNER_DISMISSED_KEY, version);
    setLastSeen(version);
    setBannerDismissed(true);
  }, []);

  const dismissBanner = useCallback(() => {
    write(BANNER_DISMISSED_KEY, latestVersion());
    setBannerDismissed(true);
  }, []);

  const unseenCount = ready && !isFirstVisit ? countItems(releasesSince(lastSeen)) : 0;

  return { ready, lastSeen, unseenCount, isFirstVisit, bannerDismissed, dismissBanner, markSeen };
}
