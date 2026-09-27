import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PromptSlot = "origin" | "update" | "install" | "offline" | "tip";

const PRIORITY: PromptSlot[] = ["origin", "update", "install", "offline", "tip"];

type PromptContextValue = {
  active: PromptSlot | null;
  setRequested: (slot: PromptSlot, requested: boolean) => void;
};

const PromptContext = createContext<PromptContextValue | null>(null);

export function PromptCoordinator({ children }: { children: ReactNode }) {
  const [requested, setRequestedState] = useState<Record<PromptSlot, boolean>>({
    origin: false,
    update: false,
    install: false,
    offline: false,
    tip: false,
  });
  const setRequested = useCallback((slot: PromptSlot, next: boolean) => {
    setRequestedState((current) => current[slot] === next ? current : { ...current, [slot]: next });
  }, []);
  const active = PRIORITY.find((slot) => requested[slot]) ?? null;
  const value = useMemo(() => ({ active, setRequested }), [active, setRequested]);
  return <PromptContext.Provider value={value}>{children}</PromptContext.Provider>;
}

export function usePromptSlot(slot: PromptSlot, requested: boolean) {
  const context = useContext(PromptContext);
  const setRequested = context?.setRequested;
  useEffect(() => {
    setRequested?.(slot, requested);
    return () => setRequested?.(slot, false);
  }, [requested, setRequested, slot]);
  return context ? context.active === slot : requested;
}