import { useEffect, useRef, type RefObject } from "react";

const DIM_MS = 1500;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/**
 * Scrolls the selected verse into the upper-middle of the viewport and briefly
 * subdues the surrounding verses. Driven entirely by the existing verse
 * selection (the `highlightVerse` prop) — there is no separate source of truth.
 *
 * The animation runs once per (book, chapter, verse) arrival, so manual
 * scrolling never re-triggers the scroll or the dimming.
 */
export function useVerseFocus({
  book,
  chapter,
  verse,
  containerRef,
  ready,
}: {
  book: string;
  chapter: number;
  verse?: number;
  containerRef: RefObject<HTMLElement | null>;
  /** Flips true once the chapter text is rendered. */
  ready: unknown;
}) {
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!verse) {
      lastKey.current = null;
      return;
    }
    const key = `${book}.${chapter}.${verse}`;
    if (lastKey.current === key) return;

    const reduced = prefersReducedMotion();
    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
    let timer: ReturnType<typeof setTimeout> | undefined;
    let dimTimer: ReturnType<typeof setTimeout> | undefined;
    let container: HTMLElement | null = null;
    let attempts = 0;

    // The verse text can arrive after this effect first runs, and the router
    // restores scroll once a navigation settles — so keep re-checking until the
    // verse is actually parked near the top of the viewport.
    const tick = () => {
      attempts += 1;
      const node = document.getElementById(`v${verse}`);
      if (node) {
        const top = node.getBoundingClientRect().top;
        const settled = top >= 0 && top <= window.innerHeight * 0.5;
        if (!settled) node.scrollIntoView({ behavior, block: "start" });
        if (lastKey.current !== key) {
          lastKey.current = key;
          container = containerRef.current;
          if (!reduced && container) {
            container.classList.add("verse-dim-context");
            const el = container;
            dimTimer = setTimeout(() => el.classList.remove("verse-dim-context"), DIM_MS);
          }
        }
        if (settled) return;
      }
      if (attempts < 24) timer = setTimeout(tick, 100);
    };
    tick();

    return () => {
      if (timer) clearTimeout(timer);
      if (dimTimer) clearTimeout(dimTimer);
      container?.classList.remove("verse-dim-context");
    };
  }, [book, chapter, verse, containerRef, ready]);
}
