import { useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MEASURE_BY_ID, MEASURE_KIND_LABEL } from "@/lib/atlas/measures";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";

export type MeasureAnchor = { measureId: string; rect: DOMRect };

/** Small overlay window with the modern conversion for a coin, weight or measure. */
export function MeasureTip({ anchor, onClose }: { anchor: MeasureAnchor; onClose: () => void }) {
  const measure = MEASURE_BY_ID[anchor.measureId];
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const margin = 10;
    let left = anchor.rect.left + anchor.rect.width / 2 - w / 2;
    left = Math.max(margin, Math.min(window.innerWidth - w - margin, left));
    let top = anchor.rect.bottom + 8;
    if (top + h > window.innerHeight - margin) top = Math.max(margin, anchor.rect.top - h - 8);
    setPos({ top, left });
  }, [anchor]);

  useDismissibleLayer({ refs: [ref], onDismiss: onClose, dismissOnScroll: true });

  if (!measure) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${measure.label} in modern terms`}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-50 w-[19rem] rounded-xl border bg-surface-raised p-3 shadow-xl [animation:panel-in_160ms_ease]"
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            {MEASURE_KIND_LABEL[measure.kind]}
          </p>
          <p className="scripture text-base leading-tight text-foreground">{measure.label}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <p className="mt-2 scripture text-2xl leading-none text-foreground">{measure.headline}</p>
      {measure.secondary && (
        <p className="mt-1 text-xs text-muted-foreground">{measure.secondary}</p>
      )}

      <dl className="mt-3 divide-y rounded-lg border bg-card text-xs">
        <div className="grid grid-cols-[4.5rem_1fr] gap-2 px-2.5 py-1.5">
          <dt className="text-muted-foreground">Then</dt>
          <dd className="text-foreground">{measure.ancient}</dd>
        </div>
        <div className="grid grid-cols-[4.5rem_1fr] gap-2 px-2.5 py-1.5">
          <dt className="text-muted-foreground">Today</dt>
          <dd className="text-foreground">{measure.modern}</dd>
        </div>
      </dl>

      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{measure.basis}</p>
      <p className="mt-1.5 border-t pt-1.5 text-[11px] leading-relaxed text-foreground/80">
        {measure.note}
      </p>
    </div>
  );
}
