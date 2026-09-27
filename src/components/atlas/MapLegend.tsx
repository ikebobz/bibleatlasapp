import { Info, X } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";

export function MapLegend({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  useDismissibleLayer({
    refs: [triggerRef, panelRef],
    enabled: open,
    onDismiss: () => onOpenChange(false),
    restoreFocusRef: triggerRef,
  });

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        size="icon"
        variant="outline"
        aria-label="Map legend"
        aria-expanded={open}
        aria-controls="journey-map-legend"
        onClick={() => onOpenChange(!open)}
        className="h-11 w-11 rounded-full bg-[var(--color-map-chrome)] text-[var(--color-map-chrome-foreground)] shadow-lg backdrop-blur-xl"
      >
        <Info aria-hidden />
      </Button>
      {open ? (
        <aside
          ref={panelRef}
          id="journey-map-legend"
          aria-label="Journey map legend"
          className="pointer-events-auto absolute right-3 top-16 z-40 w-[min(19rem,calc(100%-1.5rem))] rounded-lg border bg-[var(--color-map-chrome)] p-3 text-[var(--color-map-chrome-foreground)] shadow-2xl backdrop-blur-xl sm:right-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">Map legend</h2>
            <Button type="button" size="icon" variant="ghost" onClick={() => onOpenChange(false)} aria-label="Close map legend" className="h-11 w-11 rounded-full">
              <X aria-hidden />
            </Button>
          </div>
          <dl className="mt-1 space-y-2.5 text-xs">
            <LegendRow swatch={<span className="block h-0.5 w-9 bg-[var(--color-map-route-past)]" />} label="Journey completed" />
            <LegendRow swatch={<span className="block h-0.5 w-9 bg-[var(--color-map-route-future)]" />} label="Route ahead" />
            <LegendRow swatch={<span className="block h-0.5 w-9 bg-[var(--color-map-route-past)]" />} label="Land or walking segment" />
            <LegendRow swatch={<span className="block w-9 border-t-2 border-dashed border-[var(--color-map-route-past)]" />} label="Maritime segment" />
            <LegendRow swatch={<span className="h-3 w-3 rounded-full border-2 border-[var(--color-map-parchment)] bg-[var(--color-map-route-past)]" />} label="Reached or current stop" />
            <LegendRow swatch={<span className="h-3 w-3 rounded-full border-2 border-[var(--color-map-route-past)] bg-[var(--color-map-parchment)]" />} label="Upcoming stop" />
            <LegendRow swatch={<span className="h-4 w-4 rounded-full border-2 border-[var(--color-map-route-past)] bg-[var(--color-map-route-past)] ring-2 ring-[var(--color-map-parchment)]" />} label="Selected place" />
          </dl>
          <div className="mt-3 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
            <p><strong className="text-foreground">Well-attested</strong> — the broad route is strongly supported.</p>
            <p className="mt-1"><strong className="text-foreground">Approximate</strong> — a plausible corridor where details are uncertain.</p>
            <p className="mt-1"><strong className="text-foreground">Schematic</strong> — shows the story’s sequence, not a precise road.</p>
          </div>
        </aside>
      ) : null}
    </>
  );
}

function LegendRow({ swatch, label }: { swatch: ReactNode; label: string }) {
  return <div className="grid grid-cols-[2.75rem_1fr] items-center gap-2"><dt className="flex h-5 items-center justify-center" aria-hidden>{swatch}</dt><dd className="text-muted-foreground">{label}</dd></div>;
}