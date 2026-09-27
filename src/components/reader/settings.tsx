import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_TRANSLATION, deviceTranslation, type TranslationId } from "@/lib/translations";

export type ReaderSettings = {
  fontScale: number;
  lineHeight: number;
  quiet: boolean;
  theme: "light" | "dark";
  /** Original languages layer: tap any word for the Hebrew/Greek behind it. */
  originalLanguage: boolean;
  /** Which public-domain translation the reader shows. */
  translation: TranslationId;
};

const DEFAULTS: ReaderSettings = {
  fontScale: 1,
  lineHeight: 1.8,
  quiet: false,
  theme: "light",
  originalLanguage: false,
  translation: DEFAULT_TRANSLATION,
};
export const SETTINGS_KEY = "bible-atlas:settings";
const KEY = SETTINGS_KEY;

/**
 * The translation a first-time reader starts in: the device's own language
 * when we have a Bible for it (es-ES → Reina-Valera 1909), else the default.
 * Once any translation is saved — manual choice or a shared-link adoption —
 * detection never applies again.
 */
function firstRunTranslation(): TranslationId {
  if (typeof navigator === "undefined") return DEFAULT_TRANSLATION;
  const locales =
    navigator.languages?.length ? navigator.languages : [navigator.language].filter(Boolean);
  return deviceTranslation(locales) ?? DEFAULT_TRANSLATION;
}

/** Saved settings for this device, or the defaults (system theme on first run). */
function storedSettings(): ReaderSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ReaderSettings>) };
    const firstRun: ReaderSettings = { ...DEFAULTS, translation: firstRunTranslation() };
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches)
      return { ...firstRun, theme: "dark" };
    return firstRun;
  } catch {
    /* ignore */
  }
  return DEFAULTS;
}

type Ctx = ReaderSettings & { update: (patch: Partial<ReaderSettings>) => void };

const SettingsCtx = createContext<Ctx | null>(null);

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SettingsProvider({ children }: { children: ReactNode }) {
  // The server render has no storage, so hydration starts from the defaults and
  // the saved values are committed in a layout effect — before the first paint,
  // so there is no visible flash of default type size or theme.
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULTS);

  useIsomorphicLayoutEffect(() => {
    const saved = storedSettings();
    setSettings((prev) => (shallowEqual(prev, saved) ? prev : saved));
  }, []);

  // Keep every open tab on this device in step.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== KEY) return;
      const saved = storedSettings();
      setSettings((prev) => (shallowEqual(prev, saved) ? prev : saved));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const dark = settings.theme === "dark";
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [settings.theme]);

  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...settings, update }), [settings, update]);
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

function shallowEqual(a: ReaderSettings, b: ReaderSettings) {
  return (Object.keys(DEFAULTS) as (keyof ReaderSettings)[]).every((key) => a[key] === b[key]);
}


export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

/**
 * The current translation, safe to call outside a SettingsProvider (panels are
 * also rendered in isolation, e.g. in tests and standalone entry pages).
 */
export function useTranslationSetting(): TranslationId {
  const ctx = useContext(SettingsCtx);
  return ctx?.translation ?? DEFAULT_TRANSLATION;
}

/**
 * The saved translation, readable outside React (route loaders run before any
 * component mounts). Returns the default during SSR, where there is no
 * storage — offline reading only ever happens on the client.
 */
export function storedTranslation(): TranslationId {
  if (typeof window === "undefined") return DEFAULT_TRANSLATION;
  return storedSettings().translation;
}

const POSITION_KEY = "bible-atlas:position";

export function rememberPosition(book: string, chapter: number) {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify({ book, chapter }));
  } catch {
    /* ignore */
  }
}

export function lastPosition(): { book: string; chapter: number } | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    return raw ? (JSON.parse(raw) as { book: string; chapter: number }) : null;
  } catch {
    return null;
  }
}

/**
 * Language addresses (`/yo/genesis/1`) must render their own version on the
 * server and on first paint, before saved settings catch up. Pins the
 * translation until the device's setting matches, then passes straight
 * through so later version changes behave normally.
 */
export function TranslationPin({
  translation,
  children,
}: {
  translation: TranslationId;
  children: ReactNode;
}) {
  const ctx = useContext(SettingsCtx);
  const [pinned, setPinned] = useState(true);
  useEffect(() => {
    if (!ctx) return;
    // The address is the reader's choice: save it (the reader's own
    // link-translation effect sees the pinned value and would skip it).
    if (pinned && ctx.translation !== translation) ctx.update({ translation });
    if (ctx.translation === translation) setPinned(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.translation, translation]);
  const value = useMemo(
    () => (ctx && pinned ? { ...ctx, translation } : ctx),
    [ctx, pinned, translation],
  );
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}
