import { useState } from "react";
import { AlertTriangle, Check, Copy, Globe, Share2, Smartphone } from "lucide-react";

import { isIosThirdPartyBrowser } from "@/lib/push/subscribe";

function isIos() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" &&
      (navigator as unknown as { maxTouchPoints: number }).maxTouchPoints > 1)
  );
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

import { SITE_URL } from "@/lib/site";

export function IosPushHelp() {
  const [copied, setCopied] = useState(false);

  if (!isIos() || isStandalone()) return null;

  const thirdParty = isIosThirdPartyBrowser();

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-3 text-foreground"
      role="region"
      aria-label="iPhone and iPad daily verse setup"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 rounded-full bg-amber-500/15 p-1.5">
          <Smartphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="text-xs font-semibold">iPhone / iPad setup</h4>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Apple only allows daily verse notifications for Bible Atlas when it is added to your
            Home Screen from Safari.
          </p>
        </div>
      </div>

      {thirdParty && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-2 text-[11px] text-destructive">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            You are using a third-party browser on iOS. Chrome, Firefox, Edge and other browsers on
            iPhone/iPad cannot receive web push notifications, even after adding to Home Screen.
            Switch to Safari to continue.
          </span>
        </div>
      )}

      <ol className="space-y-2 text-[11px] leading-relaxed text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
            1
          </span>
          <span className="flex-1">
            Open{" "}
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Globe className="h-3 w-3" />
              {SITE_URL}
            </span>{" "}
            in Safari.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
            2
          </span>
          <span className="flex-1">
            Tap the{" "}
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Share2 className="h-3 w-3" />
              Share
            </span>{" "}
            button.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
            3
          </span>
          <span className="flex-1">Scroll down and tap Add to Home Screen.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
            4
          </span>
          <span className="flex-1">Launch Bible Atlas from the new Home Screen icon.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
            5
          </span>
          <span className="flex-1">Return to Settings → Daily verse and turn it on.</span>
        </li>
      </ol>

      <button
        type="button"
        onClick={copyUrl}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted"
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-emerald-500" />
            Link copied
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            Copy site link for Safari
          </>
        )}
      </button>
    </div>
  );
}
