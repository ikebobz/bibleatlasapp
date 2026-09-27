import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export const HIGHLIGHT_COLORS: { id: HighlightColor; label: string }[] = [
  { id: "yellow", label: "Yellow" },
  { id: "green", label: "Green" },
  { id: "blue", label: "Blue" },
  { id: "pink", label: "Pink" },
  { id: "purple", label: "Purple" },
];

export type Highlight = {
  book: string;
  bookName: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
  text: string;
  note?: string;
  createdAt: number;
};

const KEY = "bible-atlas:highlights";

export function highlightKey(book: string, chapter: number, verse: number) {
  return `${book}.${chapter}.${verse}`;
}

type Store = Record<string, Highlight>;

type Ctx = {
  highlights: Store;
  get: (book: string, chapter: number, verse: number) => Highlight | undefined;
  set: (h: Omit<Highlight, "createdAt">) => void;
  remove: (book: string, chapter: number, verse: number) => void;
  clear: () => void;
  list: Highlight[];
};

const HighlightCtx = createContext<Ctx | null>(null);

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setStore(JSON.parse(raw) as Store);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: Store) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    return next;
  }, []);

  const set = useCallback(
    (h: Omit<Highlight, "createdAt">) => {
      setStore((prev) =>
        persist({
          ...prev,
          [highlightKey(h.book, h.chapter, h.verse)]: {
            ...h,
            createdAt: prev[highlightKey(h.book, h.chapter, h.verse)]?.createdAt ?? Date.now(),
          },
        }),
      );
    },
    [persist],
  );

  const remove = useCallback(
    (book: string, chapter: number, verse: number) => {
      setStore((prev) => {
        const next = { ...prev };
        delete next[highlightKey(book, chapter, verse)];
        return persist(next);
      });
    },
    [persist],
  );

  const clear = useCallback(() => setStore(() => persist({})), [persist]);

  const value = useMemo<Ctx>(() => {
    const list = Object.values(store).sort((a, b) => b.createdAt - a.createdAt);
    return {
      highlights: store,
      get: (book, chapter, verse) => store[highlightKey(book, chapter, verse)],
      set,
      remove,
      clear,
      list,
    };
  }, [store, set, remove, clear]);

  return <HighlightCtx.Provider value={value}>{children}</HighlightCtx.Provider>;
}

export function useHighlights() {
  const ctx = useContext(HighlightCtx);
  if (!ctx) throw new Error("useHighlights must be used inside HighlightProvider");
  return ctx;
}
