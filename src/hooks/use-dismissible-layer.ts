import { useEffect, type RefObject } from "react";

type DismissibleLayerOptions = {
  refs: Array<RefObject<HTMLElement | null>>;
  onDismiss: () => void;
  enabled?: boolean;
  dismissOnScroll?: boolean;
  restoreFocusRef?: RefObject<HTMLElement | null>;
};

/** Shared pointer, keyboard, and focus-return behavior for floating UI. */
export function useDismissibleLayer({
  refs,
  onDismiss,
  enabled = true,
  dismissOnScroll = false,
  restoreFocusRef,
}: DismissibleLayerOptions) {
  useEffect(() => {
    if (!enabled) return;
    const dismiss = () => {
      onDismiss();
      requestAnimationFrame(() => restoreFocusRef?.current?.focus());
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      dismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      dismiss();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    if (dismissOnScroll) window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      if (dismissOnScroll) window.removeEventListener("scroll", dismiss, true);
    };
  }, [dismissOnScroll, enabled, onDismiss, refs, restoreFocusRef]);
}