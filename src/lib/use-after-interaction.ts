import { useEffect, useState } from "react";

/**
 * True once the reader has actually engaged with the page (scroll, tap, key).
 *
 * In-flow notices that appear after hydration push Scripture down the page,
 * which is both jarring and a measurable layout shift. Tying them to a real
 * interaction means the verse the reader came for renders first and stays put,
 * and any movement afterwards is attributed to the reader's own action.
 */
export function useAfterInteraction(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    let done = false;
    const fire = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const events: Array<keyof WindowEventMap> = [
      "scroll",
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    for (const e of events) window.addEventListener(e, fire, { once: true, passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, fire);
    };
  }, [ready]);

  return ready;
}
