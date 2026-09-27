import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PanelTarget =
  | { kind: "entry"; entryId: string; term?: string; reference?: string; verseText?: string }
  | { kind: "auto"; term: string; reference: string; verseText: string }
  | { kind: "lexicon"; word: string; reference: string; verseText: string };

type AtlasState = {
  stack: PanelTarget[];
  activeVerse: number | null;
  open: (target: PanelTarget, verse?: number) => void;
  back: () => void;
  close: () => void;
};

const AtlasCtx = createContext<AtlasState | null>(null);

export function AtlasProvider({
  children,
  initialEntryId,
  onTopChange,
}: {
  children: ReactNode;
  initialEntryId?: string;
  onTopChange?: (entryId: string | undefined) => void;
}) {
  const [stack, setStack] = useState<PanelTarget[]>(
    initialEntryId ? [{ kind: "entry", entryId: initialEntryId }] : [],
  );
  const [activeVerse, setActiveVerse] = useState<number | null>(null);

  const open = useCallback((target: PanelTarget, verse?: number) => {
    if (verse !== undefined) setActiveVerse(verse);
    setStack((prev) => [...prev, target]);
  }, []);

  const back = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const close = useCallback(() => {
    setStack([]);
    setActiveVerse(null);
  }, []);

  const top = stack[stack.length - 1];
  const topEntryId = top && top.kind === "entry" ? top.entryId : undefined;
  const syncRef = useRef(onTopChange);
  syncRef.current = onTopChange;

  useEffect(() => {
    syncRef.current?.(topEntryId);
  }, [topEntryId]);



  const value = useMemo(
    () => ({ stack, activeVerse, open, back, close }),
    [stack, activeVerse, open, back, close],
  );

  return <AtlasCtx.Provider value={value}>{children}</AtlasCtx.Provider>;
}

export function useAtlas() {
  const ctx = useContext(AtlasCtx);
  if (!ctx) throw new Error("useAtlas must be used inside AtlasProvider");
  return ctx;
}
