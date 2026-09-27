import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  BookText,
  CalendarClock,
  Check,
  ChevronDown,
  CloudOff,
  Download,
  Highlighter,
  Loader2,
  Info,
  Landmark,
  Map as MapIcon,

  Moon,

  Settings,
  Smartphone,
  Sun,
  Users,
  Waypoints,
  Headphones,
  Compass,
} from "lucide-react";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { BOOKS, bookName } from "@/lib/bible";
import { RELEASES } from "@/lib/release-notes";
import { chapterKey } from "@/lib/offline/chapter-store";
import { useBookDownload } from "@/lib/offline/download";
import {
  dynamicTranslation,
  getTranslation,
  registerDynamicTranslations,
  translationsByLanguage,
  type Translation,
} from "@/lib/translations";
import { PushToggle } from "../PushToggle";
import { SearchButton } from "../SearchBar";
import { useSettings } from "../settings";
import { hasAudio } from "@/lib/audio-bibles";
import { useOfflineLibrary } from "./offline-context";
import { OfflineBibleSection } from "./OfflineBibleSection";
import { WhatsNewButton } from "./WhatsNewBanner";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";

function OfflineSection({ book }: { book: string }) {
  const { online, stored, refreshStored } = useOfflineLibrary();
  const { progress, download } = useBookDownload(refreshStored);
  const { translation } = useSettings();
  const version = getTranslation(translation);
  const b = BOOKS.find((x) => x.id === book);
  const savedHere = b
    ? Array.from({ length: b.chapters }, (_, i) => i + 1).filter((c) =>
        stored.has(chapterKey(b.id, c, version.id)),
      ).length
    : 0;
  const complete = b ? savedHere === b.chapters : false;

  if (version.displayOnly) {
    return (
      <div className="space-y-2 border-t pt-3">
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {version.name} is a licensed text, so chapters are read online only and nothing is saved
          on this device. Switch to a public-domain version such as KJV or WEB to save chapters for
          offline reading.
        </p>
      </div>
    );
  }

  return (

    <div className="space-y-2 border-t pt-3">
      <button
        type="button"
        disabled={!!progress || complete || !online}
        onClick={() => void download(book, version.id)}
        className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-1.5 text-foreground">
          {progress ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : complete ? (
            <Check className="h-3 w-3 text-primary" />
          ) : (
            <Download className="h-3 w-3" />
          )}
          {complete
            ? `Saved for offline (${version.label})`
            : `Save ${bookName(book)} for offline (${version.label})`}
        </span>
        <span className="text-muted-foreground">
          {progress
            ? `${progress.done}/${progress.total}`
            : b
              ? `${savedHere}/${b.chapters}`
              : ""}
        </span>
      </button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {online
          ? `${stored.size} chapter${stored.size === 1 ? "" : "s"} available on this device. Saved chapters and any context you have already opened keep working without a connection.`
          : "You're offline. Chapters saved on this device are still readable."}
      </p>
    </div>
  );
}

type CatalogueResponse = {
  bibles?: {
    id: string;
    label: string;
    name: string;
    language: string;
    apiBibleId: string;
    copyright?: string;
  }[];
};

/**
 * The bibles our API.Bible key authorises, fetched once a day and merged on
 * top of the built-in public-domain list (never replacing it).
 */
function useCatalogueTranslations(): Translation[] {
  const { data } = useQuery({
    queryKey: ["apibible-catalogue"],
    queryFn: async (): Promise<Translation[]> => {
      const res = await fetch("/api/public/get-available-bibles");
      if (!res.ok) return [];
      const json = (await res.json()) as CatalogueResponse;
      const rows = (json.bibles ?? []).map(dynamicTranslation);
      registerDynamicTranslations(rows);
      return rows;
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });
  return data ?? [];
}

function VersionMenu() {
  const { translation, update } = useSettings();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const extra = useCatalogueTranslations();
  const active = getTranslation(translation);
  useDismissibleLayer({ refs: [triggerRef, menuRef], enabled: open, onDismiss: () => setOpen(false), restoreFocusRef: triggerRef });

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Bible version: ${active.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {active.label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div
            ref={menuRef}
            role="menu"
            className="absolute right-0 z-40 mt-2 max-h-[70vh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border bg-popover p-1.5 shadow-xl"
          >
            {translationsByLanguage(extra).map((group) => (
              <div key={group.language}>
                <p className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.language}
                </p>
                {group.items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={t.id === active.id}
                    onClick={() => {
                      update({ translation: t.id });
                      setOpen(false);
                    }}
                    className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted"
                  >
                    <Check
                      className={
                        "mt-0.5 h-3.5 w-3.5 shrink-0 " +
                        (t.id === active.id ? "text-primary" : "text-transparent")
                      }
                    />
                    <span className="min-w-0">
                      <span className="block text-xs text-foreground">
                        {t.name}{" "}
                        <span className="text-muted-foreground">({t.label})</span>
                        {hasAudio(t.id) ? (
                          <span
                            className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-[0.1em] text-primary"
                            title="Synced audio available"
                          >
                            <Headphones className="h-2.5 w-2.5" aria-hidden />
                            Audio
                          </span>
                        ) : null}
                      </span>
                    </span>

                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SettingsMenu({ book }: { book: string }) {
  const { fontScale, lineHeight, quiet, theme, originalLanguage, update } = useSettings();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissibleLayer({ refs: [triggerRef, menuRef], enabled: open, onDismiss: () => setOpen(false), restoreFocusRef: triggerRef });

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Reading settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
      >
        <Settings className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div ref={menuRef} role="dialog" aria-label="Reading settings" className="absolute right-0 z-40 mt-2 max-h-[70vh] w-64 max-w-[calc(100vw-2rem)] overflow-y-auto space-y-4 rounded-xl border bg-popover p-4 shadow-xl">
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Text size</label>
              <input
                type="range"
                min={80}
                max={150}
                step={5}
                value={Math.round(fontScale * 100)}
                onChange={(e) => update({ fontScale: Number(e.target.value) / 100 })}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Line spacing</label>
              <input
                type="range"
                min={150}
                max={230}
                step={5}
                value={Math.round(lineHeight * 100)}
                onChange={(e) => update({ lineHeight: Number(e.target.value) / 100 })}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--color-primary)]"
              />
            </div>
            <button
              type="button"
              onClick={() => update({ quiet: !quiet })}
              className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs"
            >
              <span className="text-foreground">Quiet mode</span>
              <span className={quiet ? "text-primary" : "text-muted-foreground"}>
                {quiet ? "On" : "Off"}
              </span>
            </button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Quiet mode dims Atlas markings so you can read without interruption. Words stay
              tappable.
            </p>
            <button
              type="button"
              onClick={() => update({ originalLanguage: !originalLanguage })}
              className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs"
            >
              <span className="text-foreground">Original languages</span>
              <span className={originalLanguage ? "text-primary" : "text-muted-foreground"}>
                {originalLanguage ? "On" : "Off"}
              </span>
            </button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Tap any word to see the Hebrew or Greek behind it — transliteration, pronunciation,
              root and meaning range.
            </p>
            <p className="border-t pt-3 text-[11px] text-muted-foreground">
              Bible Atlas version {RELEASES[0]?.version}
            </p>
            <button
              type="button"
              onClick={() => update({ theme: theme === "dark" ? "light" : "dark" })}
              className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs"
            >
              <span className="text-foreground">Appearance</span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                {theme === "dark" ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
                {theme === "dark" ? "Dark" : "Light"}
              </span>
            </button>
            <OfflineBibleSection />
            <OfflineSection book={book} />
            <PushToggle />
          </div>
        </>
      )}
    </div>
  );
}

const EXPLORE_LINKS = [
  { to: "/maps" as const, label: "Maps", icon: MapIcon },
  { to: "/timeline" as const, label: "Timeline", icon: CalendarClock },
  { to: "/concordance" as const, label: "Concordance", icon: BookText },
  { to: "/people" as const, label: "People", icon: Users },
  { to: "/places" as const, label: "Places", icon: Landmark },
  { to: "/connections" as const, label: "Connections", icon: Waypoints },
  { to: "/highlights" as const, label: "Highlights", icon: Highlighter },
  { to: "/install" as const, label: "Install", icon: Smartphone },
  { to: "/about" as const, label: "About", icon: Info },
];

function ExploreMenu() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismissibleLayer({ refs: [triggerRef, menuRef], enabled: open, onDismiss: () => setOpen(false), restoreFocusRef: triggerRef });
  return (
    <div className="relative">
      <button ref={triggerRef} type="button" onClick={() => setOpen((value) => !value)} aria-label="Explore Bible Atlas" aria-haspopup="menu" aria-expanded={open} className="inline-flex h-11 items-center gap-1.5 rounded-full border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
        <Compass className="h-4 w-4" aria-hidden />
        <span className="hidden md:inline">Explore</span>
      </button>
      {open && (
        <div ref={menuRef} role="menu" className="absolute right-0 z-40 mt-2 grid w-64 max-w-[calc(100vw-2rem)] grid-cols-2 gap-1 rounded-xl border bg-popover p-2 shadow-xl">
          {EXPLORE_LINKS.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs text-foreground transition-colors hover:bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />{label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Sticky reader header: wordmark, search, version and settings. */
export function ReaderHeader({
  book,
  chapter,
}: {
  book: string;
  chapter: number;
}) {
  const { online, stored } = useOfflineLibrary();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4">
        <Link to="/" aria-label="Bible Atlas home" className="flex min-h-11 shrink-0 items-center gap-2">

          <BookOpen className="h-4 w-4 text-primary" aria-hidden />
          <span className="hidden whitespace-nowrap text-sm font-semibold tracking-tight min-[430px]:inline">Bible Atlas</span>
        </Link>
        <span className="scripture ml-2 hidden text-sm text-muted-foreground sm:inline">
          {bookName(book)} {chapter}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <WhatsNewButton />
          <SearchButton />
          <ExploreMenu />
          <VersionMenu />
          <SettingsMenu book={book} />
        </div>
      </div>
      {!online && (
        <div className="flex items-center gap-2 border-t border-dashed bg-muted/50 px-4 py-1.5 text-[11px] text-muted-foreground">
          <CloudOff className="h-3.5 w-3.5 text-primary" />
          <span>
            Offline — reading from this device. {stored.size} chapter
            {stored.size === 1 ? "" : "s"} saved.
          </span>
        </div>
      )}
    </header>
  );
}
