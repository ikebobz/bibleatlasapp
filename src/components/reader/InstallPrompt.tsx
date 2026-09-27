import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, X } from "lucide-react";

import { trackShare } from "@/lib/analytics/share-events";
import { detectPlatform, type PlatformInfo } from "@/lib/pwa/platform";
import { recordInstallCompleted } from "@/lib/pwa/install-signal";
import { InstallGuideSheet, SafariShareGlyph, variantForPlatform } from "@/components/install/InstallGuide";
import { usePromptSlot } from "@/components/pwa/PromptCoordinator";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const NEVER_KEY = "bible-atlas:install-never";
const SNOOZE_KEY = "bible-atlas:install-dismissed-until";
const VISITS_KEY = "bible-atlas:visits";
/** Legacy key from the previous banner — honoured so old dismissals stick. */
const LEGACY_DISMISS_KEY = "bible-atlas:install-dismissed";

const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

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

/** Count this session once so the banner can wait for a second visit. */
function bumpVisits(): number {
  const n = Number(read(VISITS_KEY) ?? "0") + 1;
  write(VISITS_KEY, String(n));
  return n;
}

function suppressed(): boolean {
  if (read(NEVER_KEY) || read(LEGACY_DISMISS_KEY)) return true;
  const until = Number(read(SNOOZE_KEY) ?? "0");
  return Number.isFinite(until) && until > Date.now();
}

/**
 * Site-wide install banner.
 *
 * Android/desktop get the real browser prompt; iOS Safari gets a working
 * "Show me how" button that opens Apple's actual Add to Home Screen steps —
 * never a dead button pretending to install. Shown at a natural moment
 * (second visit, or after a little reading) and never once installed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [platform, setPlatform] = useState<PlatformInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const info = detectPlatform();
    setPlatform(info);

    if (info.isStandalone) {
      trackShare("standalone_app_opened", { resourceType: "chapter", resourceRef: info.kind });
      return;
    }
    if (suppressed()) return;

    const visits = bumpVisits();

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const onInstalled = () => {
      trackShare("install_accepted", { resourceType: "chapter", resourceRef: info.kind });
      recordInstallCompleted("appinstalled");
      setVisible(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt — surface the manual route instead,
    // but only once the visitor has actually experienced the product.
    const delay = visits >= 2 ? 4000 : 45000;
    const t = setTimeout(() => {
      if (info.isIos || info.isInAppBrowser) setVisible(true);
    }, delay);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    if (!visible || !platform) return;
    trackShare("install_prompt_shown", {
      resourceType: "chapter",
      resourceRef: `${platform.kind}/${platform.browser}`,
    });
  }, [visible, platform]);

  const snooze = useCallback(() => {
    write(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    trackShare("install_dismissed", { resourceType: "chapter", resourceRef: "snooze" });
    setVisible(false);
  }, []);

  const never = useCallback(() => {
    write(NEVER_KEY, "1");
    trackShare("install_dismissed", { resourceType: "chapter" });
    setVisible(false);
  }, []);

  const allowed = usePromptSlot("install", visible && Boolean(platform));

  if (!allowed || !platform) return null;

  const variant = variantForPlatform(platform.kind, platform.isInAppBrowser);
  const inApp = platform.isInAppBrowser;

  return (
    <>
      <aside
        className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(var(--audio-bar-h,0px)+var(--chapter-nav-h,0px)+max(0.75rem,env(safe-area-inset-bottom)))]"
        aria-label="Install Bible Atlas"
      >
        <div className="mx-auto max-w-md rounded-xl border bg-surface-raised p-4 shadow-lg">
          <div className="flex items-start gap-3">
            <img
              src="/apple-touch-icon.png"
              alt=""
              width={36}
              height={36}
              className="mt-0.5 h-9 w-9 shrink-0 rounded-xl border"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">
                {inApp ? "Open in your browser to install" : "Get Bible Atlas on your Home Screen"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {inApp
                  ? "This in-app browser can't add apps. Open Bible Atlas in Safari or Chrome, then add it to your Home Screen."
                  : "Install the app for faster access, offline Bible reading and a better mobile experience."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {deferred ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    onClick={() => {
                      trackShare("install_prompt_opened", {
                        resourceType: "chapter",
                        resourceRef: platform.kind,
                      });
                      void deferred.prompt().then(async () => {
                        const choice = await deferred.userChoice.catch(() => null);
                        trackShare(
                          choice?.outcome === "accepted" ? "install_accepted" : "install_dismissed",
                          { resourceType: "chapter", resourceRef: platform.kind },
                        );
                        setVisible(false);
                      });
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> Install
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    onClick={() => {
                      trackShare("install_prompt_opened", {
                        resourceType: "chapter",
                        resourceRef: platform.kind,
                      });
                      trackShare("install_instructions_viewed", {
                        resourceType: "chapter",
                        resourceRef: variant,
                      });
                      setGuideOpen(true);
                    }}
                  >
                    <SafariShareGlyph className="h-3.5 w-3.5" /> Show me how
                  </button>
                )}
                <Link
                  to="/install"
                  onClick={() => setVisible(false)}
                  className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                >
                  Install help
                </Link>
                <button
                  type="button"
                  onClick={snooze}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" /> Not now
                </button>
                <button
                  type="button"
                  onClick={never}
                  className="text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  Don't show again
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
      {guideOpen && <InstallGuideSheet variant={variant} onClose={() => setGuideOpen(false)} />}
    </>
  );
}
