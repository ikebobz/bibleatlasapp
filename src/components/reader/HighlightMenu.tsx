import { useRef } from "react";
import { Check, Copy, Share2, Trash2 } from "lucide-react";
import { HIGHLIGHT_COLORS, type HighlightColor } from "@/lib/highlights";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";

export type HighlightAnchor = { rect: DOMRect; current?: HighlightColor };

export function HighlightMenu({
  anchor,
  reference,
  onPick,
  onRemove,
  onCopy,
  onShare,
  onClose,
}: {
  anchor: HighlightAnchor;
  reference: string;
  onPick: (color: HighlightColor) => void;
  onRemove: () => void;
  onCopy: () => void;
  onShare: () => void;
  onClose: () => void;
}) {

  const ref = useRef<HTMLDivElement>(null);

  useDismissibleLayer({ refs: [ref], onDismiss: onClose, dismissOnScroll: true });

  const width = 232;
  const left = Math.min(
    Math.max(8, anchor.rect.left + anchor.rect.width / 2 - width / 2),
    (typeof window !== "undefined" ? window.innerWidth : 800) - width - 8,
  );
  const top = anchor.rect.bottom + 8;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Highlight ${reference}`}
      style={{ position: "fixed", left, top, width }}
      className="z-50 animate-in fade-in zoom-in-95 rounded-xl border bg-popover p-2.5 shadow-lg"
    >
      <p className="px-0.5 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {reference}
      </p>
      <div className="flex items-center gap-1.5">
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-label={`Highlight ${c.label}`}
            onClick={() => onPick(c.id)}
            className={`hl-swatch hl-${c.id} inline-flex h-11 w-11 items-center justify-center rounded-full border transition-transform hover:scale-110 ${
              anchor.current === c.id ? "ring-2 ring-primary ring-offset-1 ring-offset-popover" : ""
            }`}
          >
            {anchor.current === c.id && <Check className="h-3.5 w-3.5 text-foreground" />}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 border-t pt-2">
        <button
          type="button"
          onClick={onShare}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Share2 className="h-3.5 w-3.5" /> Share
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Copy className="h-3.5 w-3.5" /> Copy
        </button>
        {anchor.current && (

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}
