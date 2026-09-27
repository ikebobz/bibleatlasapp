/**
 * Shown inside an installed app that was added from the wrong address.
 *
 * Those installs can never receive new builds, so the only real fix is to
 * reinstall from mybibleatlas.com. Dismissible, and never shown in the browser
 * or on the canonical domain.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, X } from "lucide-react";

import { canonicalHere, shouldWarnAboutOrigin, SITE_HOST } from "@/lib/pwa/origin";
import { isStandaloneDisplay } from "@/lib/pwa/platform";
import { usePromptSlot } from "@/components/pwa/PromptCoordinator";

const DISMISS_KEY = "bible-atlas:wrong-origin-dismissed";

export function WrongOriginNotice() {
  const [show, setShow] = useState(false);
  const [href, setHref] = useState("https://mybibleatlas.com/");

  useEffect(() => {
    if (!shouldWarnAboutOrigin() || !isStandaloneDisplay()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* ignore */
    }
    setHref(canonicalHere());
    setShow(true);
  }, []);

  const allowed = usePromptSlot("origin", show);

  if (!allowed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div
      role="alert"
      className="fixed inset-x-3 z-[70] rounded-xl border border-amber-500/40 bg-surface-raised p-4 shadow-xl"
      style={{ bottom: "calc(var(--audio-bar-h, 0px) + var(--chapter-nav-h, 0px) + env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">This app can't update</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            It was added to your Home Screen from an old address, so it keeps opening an old version
            of Bible Atlas. Delete this icon, open <strong>{SITE_HOST}</strong> in your browser, and
            add it again to get the latest translations and features.
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Highlights and your reading position saved under the old address won't carry over.
          </p>
          <a
            href={href}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Open {SITE_HOST}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
