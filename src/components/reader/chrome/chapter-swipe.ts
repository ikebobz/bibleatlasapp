import { useEffect, type RefObject } from "react";

/** Classify a finished gesture: only clear horizontal swipes count. */
export function classifySwipe(dx: number, dy: number, ms: number): "next" | "prev" | null {
  if (ms > 800) return null;
  if (Math.abs(dx) < 60) return null;
  if (Math.abs(dx) < Math.abs(dy) * 2) return null;
  return dx < 0 ? "next" : "prev";
}

const IGNORE = "input, textarea, select, button, a, [role=dialog], [data-no-swipe]";

/** Swipe left/right on the reading area to change chapter; vertical scrolling is untouched. */
export function useChapterSwipe(
  ref: RefObject<HTMLElement | null>,
  { onNext, onPrev, enabled = true }: { onNext: () => void; onPrev: () => void; enabled?: boolean },
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let start: { x: number; y: number; t: number } | null = null;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return (start = null);
      const target = e.target as Element | null;
      if (target?.closest(IGNORE)) return (start = null);
      const t = e.touches[0];
      start = { x: t.clientX, y: t.clientY, t: Date.now() };
    };
    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const s = start;
      start = null;
      if (window.getSelection()?.toString()) return;
      const dir = classifySwipe(t.clientX - s.x, t.clientY - s.y, Date.now() - s.t);
      if (dir === "next") onNext();
      if (dir === "prev") onPrev();
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [ref, onNext, onPrev, enabled]);
}
