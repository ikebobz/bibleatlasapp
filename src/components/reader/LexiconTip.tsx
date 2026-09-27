import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { LexiconCard } from "./LexiconCard";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";

export type LexiconAnchor = {
  word: string;
  reference: string;
  verseText: string;
  rect: DOMRect;
};

/** Anchored overlay showing the Hebrew/Greek word behind the tapped English word. */
export function LexiconTip({
  anchor,
  onClose,
  onExpand,
}: {
  anchor: LexiconAnchor;
  onClose: () => void;
  onExpand?: (word: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [word, setWord] = useState(anchor.word);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });

  useEffect(() => setWord(anchor.word), [anchor]);

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
  }, [anchor, word]);

  useDismissibleLayer({ refs: [ref], onDismiss: onClose, dismissOnScroll: true });

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`${word} in the original language`}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-50 max-h-[70vh] w-[21rem] overflow-y-auto rounded-xl border bg-surface-raised p-3 shadow-xl [animation:panel-in_160ms_ease]"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-muted-foreground">
          “{word}” · {anchor.reference}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {onExpand && (
            <button
              type="button"
              onClick={() => onExpand(word)}
              aria-label="Open full entry"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <LexiconCard
        key={word}
        word={word}
        reference={anchor.reference}
        verseText={anchor.verseText}
        onPickWord={setWord}
        onNavigate={onClose}
      />
    </div>
  );
}
