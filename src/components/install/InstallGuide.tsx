/**
 * Branded, illustrated installation instructions.
 *
 * iOS Safari exposes no install API, so the honest fix is to show the user
 * exactly where Apple's Share button lives and what to tap. The same component
 * powers the banner sheet and the /install page.
 */

import { Check, Plus, Share as ShareIcon, X } from "lucide-react";
import { useRef, type ReactNode } from "react";

import type { PlatformKind } from "@/lib/pwa/platform";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type GuideVariant = "iphone" | "ipad" | "android" | "desktop" | "inapp";

export function variantForPlatform(kind: PlatformKind, isInAppBrowser: boolean): GuideVariant {
  if (isInAppBrowser) return "inapp";
  if (kind === "iphone") return "iphone";
  if (kind === "ipad") return "ipad";
  if (kind === "android") return "android";
  return "desktop";
}

/** Apple's share glyph, drawn so users recognise it before hunting for it. */
export function SafariShareGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden>
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="M8.5 6.5 12 3l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10.5H5.5A1.5 1.5 0 0 0 4 12v7.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5H17" strokeLinecap="round" />
    </svg>
  );
}

/** A phone outline showing where the Safari toolbar sits on each device. */
function DeviceHint({ variant }: { variant: "iphone" | "ipad" }) {
  const bottom = variant === "iphone";
  return (
    <div className="rounded-xl border bg-surface-raised p-3">
      <div className="mx-auto flex h-32 w-full max-w-[190px] flex-col overflow-hidden rounded-lg border bg-background">
        {!bottom && (
          <div className="flex items-center justify-between border-b px-2 py-1.5">
            <span className="h-1.5 w-14 rounded-full bg-muted" />
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary ring-2 ring-primary/40">
              <SafariShareGlyph className="h-3 w-3" />
            </span>
          </div>
        )}
        <div className="flex-1 space-y-1.5 p-2">
          <span className="block h-1.5 w-3/4 rounded-full bg-muted" />
          <span className="block h-1.5 w-full rounded-full bg-muted" />
          <span className="block h-1.5 w-5/6 rounded-full bg-muted" />
          <span className="block h-1.5 w-2/3 rounded-full bg-muted" />
        </div>
        {bottom && (
          <div className="flex items-center justify-between border-t px-2 py-1.5">
            <span className="h-1.5 w-10 rounded-full bg-muted" />
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-primary ring-2 ring-primary/40">
              <SafariShareGlyph className="h-3 w-3" />
            </span>
            <span className="h-1.5 w-6 rounded-full bg-muted" />
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        {bottom
          ? "The Share button sits in the bar at the bottom of Safari."
          : "The Share button sits in the bar at the top of Safari."}
      </p>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {n}
      </span>
      <span className="text-sm text-foreground">{children}</span>
    </li>
  );
}

const inlineIcon =
  "mx-0.5 inline-flex h-5 w-5 -translate-y-px items-center justify-center rounded-md bg-primary/10 align-middle text-primary";

export function InstallSteps({ variant }: { variant: GuideVariant }) {
  if (variant === "iphone" || variant === "ipad") {
    return (
      <div className="space-y-4">
        <DeviceHint variant={variant} />
        <div className="flex items-center gap-3 rounded-xl border bg-surface-raised p-3">
          <img
            src="/apple-touch-icon.png"
            alt="The Bible Atlas Home Screen icon"
            width={52}
            height={52}
            className="h-13 w-13 shrink-0 rounded-[13px] border"
            style={{ height: 52, width: 52 }}
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            This is the icon you'll get on your Home Screen. If it appears blank or shows a letter,
            you installed from the wrong address — remove it and add it again from{" "}
            <strong className="text-foreground">mybibleatlas.com</strong>.
          </p>
        </div>
        <ol className="space-y-3">
          <Step n={0}>
            Check the address bar reads <strong className="font-semibold">mybibleatlas.com</strong>.
            Installing from any other address gives you an app that can never update.
          </Step>
          <Step n={1}>
            Tap the <span className={inlineIcon}><SafariShareGlyph className="h-3.5 w-3.5" /></span> Share button in
            Safari.
          </Step>
          <Step n={2}>
            Scroll down the list and tap{" "}
            <strong className="font-semibold">
              Add to Home Screen{" "}
              <span className={inlineIcon}>
                <Plus className="h-3.5 w-3.5" />
              </span>
            </strong>
            .
          </Step>
          <Step n={3}>
            Tap <strong className="font-semibold">Add</strong> in the top-right corner.
          </Step>
          <Step n={4}>Open Bible Atlas from your Home Screen — it launches full screen and works offline.</Step>
        </ol>
        <p className="text-xs text-muted-foreground">
          Add to Home Screen only appears in Safari. If you opened this link from another app, tap the “…” menu and
          choose “Open in Safari” first.
        </p>
      </div>
    );
  }

  if (variant === "android") {
    return (
      <ol className="space-y-3">
        <Step n={1}>Tap the ⋮ menu in Chrome (top-right).</Step>
        <Step n={2}>
          Choose <strong className="font-semibold">Install app</strong> or{" "}
          <strong className="font-semibold">Add to Home screen</strong>.
        </Step>
        <Step n={3}>
          Confirm with <strong className="font-semibold">Install</strong>.
        </Step>
        <Step n={4}>Bible Atlas appears in your app drawer and opens without the browser bar.</Step>
      </ol>
    );
  }

  if (variant === "desktop") {
    return (
      <ol className="space-y-3">
        <Step n={1}>Open mybibleatlas.com in Chrome, Edge or Safari.</Step>
        <Step n={2}>
          In Chrome or Edge, click the install icon in the address bar (a monitor with an arrow), or use the ⋮ menu →{" "}
          <strong className="font-semibold">Install Bible Atlas</strong>.
        </Step>
        <Step n={3}>
          On macOS Safari, use <strong className="font-semibold">File → Add to Dock</strong>.
        </Step>
        <Step n={4}>Bible Atlas opens in its own window from your dock or taskbar.</Step>
      </ol>
    );
  }

  return (
    <ol className="space-y-3">
      <Step n={1}>You're reading inside another app's built-in browser, which can't install apps.</Step>
      <Step n={2}>
        Tap the “…” or ⋮ menu and choose <strong className="font-semibold">Open in Safari</strong> (iPhone/iPad) or{" "}
        <strong className="font-semibold">Open in Chrome</strong> (Android).
      </Step>
      <Step n={3}>Then follow the Add to Home Screen steps there.</Step>
    </ol>
  );
}

export function InstallGuideSheet({
  variant,
  onClose,
}: {
  variant: GuideVariant;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showClose={false} className="bottom-0 left-1/2 top-auto block max-h-[85vh] w-full max-w-md translate-x-[-50%] translate-y-0 overflow-y-auto rounded-t-lg p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:bottom-auto sm:top-1/2 sm:translate-y-[-50%] sm:rounded-lg" onOpenAutoFocus={(event) => { event.preventDefault(); closeRef.current?.focus(); }}>
        <DialogTitle className="sr-only">Install Bible Atlas</DialogTitle>
        <DialogDescription className="sr-only">Steps for adding Bible Atlas to this device.</DialogDescription>
        <div className="flex items-start gap-3">
          <img
            src="/apple-touch-icon.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl border"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">Install Bible Atlas</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Faster opening, offline reading and shared links that land on the verse.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <InstallSteps variant={variant} />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Check className="h-4 w-4" /> Got it
        </button>
      </DialogContent>
    </Dialog>
  );
}

export { ShareIcon };
