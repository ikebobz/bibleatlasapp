import { MapPin, Route } from 'lucide-react';
import { searchMapCatalogue } from '@/lib/atlas/catalogue';
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BOOKS, parseReference } from "@/lib/bible";
import { searchScripture } from "@/lib/search.functions";
import { getTranslation, searchSourceFor } from "@/lib/translations";
import { useSettings } from "./settings";
import { useOnline } from "@/lib/offline/useOnline";
import { isFullyDownloaded, searchStoredBible } from "@/lib/offline/local-search";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function useDebounced(value: string, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** "John 3:16" / "john 3" → a jump target inside the available library. */
function referenceTarget(input: string) {
  const base = parseReference(input);
  if (!base) return null;
  const book = BOOKS.find((b) => b.id === base.book)!;
  if (base.chapter < 1 || base.chapter > book.chapters) return null;
  const verse = input.match(/\d+\s*[:.]\s*(\d+)/);
  return { ...base, verse: verse ? Number(verse[1]) : undefined };
}

function highlight(text: string, query: string) {
  const terms = query
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!terms.length) return text;
  const parts = text.split(new RegExp(`(${terms.join("|")})`, "gi"));
  return parts.map((p, i) =>
    terms.some((t) => new RegExp(`^${t}$`, "i").test(p)) ? (
      <mark key={i} className="bg-primary/15 text-foreground">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export function SearchDialog({ onClose }: { onClose: () => void }) {
  const [term, setTerm] = useState("");
  const debounced = useDebounced(term);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);
  const jump = referenceTarget(term);

  const online = useOnline();
  const { translation } = useSettings();
  const version = getTranslation(translation);
  const source = searchSourceFor(translation);
  const searchable = source.kind !== "none";

  const mapResults = useMemo(() => searchMapCatalogue(debounced), [debounced]);
  const { data, isFetching, error } = useQuery({
    // The translation and its resolved source are part of the key, so results
    // from one version can never be reused for another.
    queryKey: ["search", translation, source.kind, debounced, online],
    // Offline (or when the online index fails) we search the Bible stored on
    // this device, so a downloaded translation keeps search working.
    queryFn: async () => {
      // A fully downloaded version is searched on the device even when online:
      // the results are identical, instant, and cost no API requests.
      if (!online || (await isFullyDownloaded(translation))) {
        const hits = await searchStoredBible(debounced, translation);
        return { translation, supported: true, offline: true, hits };
      }
      try {
        const res = await searchScripture({ data: { query: debounced, translation } });
        return { ...res, offline: false };
      } catch (err) {
        const local = await searchStoredBible(debounced, translation);
        if (local.length) return { translation, supported: true, offline: true, hits: local };
        throw err;
      }
    },
    enabled: searchable && debounced.trim().length >= 3,
    // Without this React Query pauses the query while the browser is offline,
    // which is exactly when the on-device index needs to run.
    networkMode: "always",
    staleTime: 1000 * 60 * 10,
  });

  const hits = data?.hits ?? [];


  const go = (book: string, chapter: number, verse?: number) => {
    onClose();
    navigate({
      to: "/$book/$chapter",
      params: { book, chapter: String(chapter) },
      search: verse ? { v: verse } : {},
    });
  };

  return (
    <DialogContent showClose={false} className="left-1/2 top-[10vh] block w-[min(38rem,92vw)] max-w-none translate-x-[-50%] translate-y-0 gap-0 overflow-hidden rounded-lg p-0" onOpenAutoFocus={(event) => { event.preventDefault(); inputRef.current?.focus(); }}>
      <DialogTitle className="sr-only">Search the Bible</DialogTitle>
      <DialogDescription className="sr-only">Search Scripture text or open a Bible reference.</DialogDescription>
        <div className="flex items-center gap-2.5 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            aria-label="Search the Bible text or jump to a reference"

            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && jump) go(jump.book, jump.chapter, jump.verse);
            }}
            placeholder="Search the text, or jump to “John 3:16”"
            className="h-14 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
          <span className="hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:inline">
            {version.label}
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {jump && (
            <button
              type="button"
              onClick={() => go(jump.book, jump.chapter, jump.verse)}
              className="mb-1 flex w-full items-center justify-between rounded-lg bg-primary/10 px-3 py-2.5 text-left"
            >
              <span className="scripture text-sm text-foreground">
                Go to {term.trim()}
              </span>
              <span className="text-[11px] text-muted-foreground">Enter</span>
            </button>
          )}

          {!searchable && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Text search isn’t available for the {version.name} — jump to a reference above, or
              switch versions to search.
            </p>
          )}

          {searchable && !online && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              You’re offline — searching the {version.name} saved on this device.
            </p>
          )}

          {searchable && isFetching && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Searching {version.name}…
            </p>
          )}

          {searchable && error && !isFetching && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Search is unavailable right now. Try a reference like “Genesis 12”.
            </p>
          )}

          {searchable &&
            !error &&
            hits.length === 0 &&
            debounced.trim().length >= 3 &&
            !isFetching && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No verses found in the {version.name}.
              </p>
            )}

          
          {mapResults.features.length > 0 && (
            <div className="mb-2 border-b pb-2">
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Places</p>
              {mapResults.features.map((f) => (
                <button key={f.id} type="button" onClick={() => { onClose(); navigate({ to: "/maps", search: { place: f.id } }); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium">{f.name} <span className="text-[10px] text-muted-foreground">{f.modernName || f.region}</span></span>
                </button>
              ))}
            </div>
          )}

          {mapResults.journeys.length > 0 && (
            <div className="mb-2 border-b pb-2">
              <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Journeys</p>
              {mapResults.journeys.map((j) => (
                <button key={j.id} type="button" onClick={() => { onClose(); navigate({ to: "/journeys/$journey", params: { journey: j.id } }); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted">
                  <Route className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-medium">{j.title} <span className="text-[10px] text-muted-foreground">{j.era}</span></span>
                </button>
              ))}
            </div>
          )}
{hits.map((hit) => (
            <button
              key={`${hit.book}-${hit.chapter}-${hit.verse}`}
              type="button"
              onClick={() => go(hit.book, hit.chapter, hit.verse)}
              className="flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                {hit.reference}
              </span>
              <span className="scripture line-clamp-2 text-sm leading-snug text-muted-foreground">
                {highlight(hit.text, debounced)}
              </span>
            </button>
          ))}

          {hits.length > 0 && (
            <p className="px-3 pb-1 pt-2 text-[11px] text-muted-foreground">
              Results from {version.name}
              {data?.offline ? " saved on this device" : ""}
            </p>
          )}


          {!term && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Search words or phrases across the whole Bible.
            </p>
          )}
        </div>
    </DialogContent>
  );
}

export function SearchButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search the Bible"
        className="inline-flex h-11 items-center gap-1.5 rounded-full border px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search</span>
      </button>
      </DialogTrigger>
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </Dialog>
  );
}
