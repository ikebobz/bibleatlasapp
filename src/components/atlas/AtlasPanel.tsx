import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, BookMarked, Check, Loader2, Map as MapIcon, Share2, Sparkles, X } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { BlockView } from "./BlockView";
import { useAtlas } from "./AtlasContext";
import { ENTRY_BY_ID } from "@/lib/atlas/entries";
import { JOURNEY_BY_ID, JOURNEY_FOR_ENTRY } from "@/lib/atlas/journeys";
import { mapPlaceIdForEntity } from "@/lib/atlas/catalogue";
import { trackShare } from "@/lib/analytics/share-events";
import { nativeShare } from "@/lib/share";

import { contextualPurpose } from "@/lib/atlas/artifact-context";
import { getAiContext } from "@/lib/atlas/ai.functions";
import { getArtifactPurpose } from "@/lib/atlas/purpose.functions";
import {
  purposeKey,
  readCachedPurpose,
  writeCachedPurpose,
  type CachedPurpose,
} from "@/lib/atlas/purpose-cache";
import {
  contextKey,
  readCachedContextPanel,
  writeCachedContextPanel,
} from "@/lib/atlas/context-cache.browser";


import { LexiconCard } from "@/components/reader/LexiconCard";
import { NODE_BY_ENTRY } from "@/lib/threads/graph";
import { entityByName } from "@/lib/entities/registry";
import type { EntityKind } from "@/lib/atlas/types";
import { useOnline } from "@/lib/offline/useOnline";
import { useTranslationSetting } from "@/components/reader/settings";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MAP_FEATURE_BY_ID } from "@/lib/atlas/catalogue";

const PlaceMapPeek = lazy(() => import("./PlaceMapPeek").then((m) => ({ default: m.PlaceMapPeek })));

const KIND_LABEL: Record<EntityKind, string> = {
  person: "Person",
  place: "Place",
  people: "People",
  journey: "Journey",
  event: "Event",
  object: "Object",
  covenant: "Covenant",
  prophecy: "Prophecy",
  miracle: "Miracle",
  concept: "Theme",
};

function AiPanelBody({
  term,
  reference,
  verseText,
}: {
  term: string;
  reference: string;
  verseText: string;
}) {
  const fetchContext = useServerFn(getAiContext);
  const { open } = useAtlas();
  const online = useOnline();
  const translation = useTranslationSetting();
  const cacheKey = contextKey({ term, reference, translation });
  const cached = useMemo(() => readCachedContextPanel(cacheKey), [cacheKey]);
  const { data, isPending, error } = useQuery({
    queryKey: ["ai-context", cacheKey],
    queryFn: async () => {
      const result = await fetchContext({ data: { term, reference, verseText, translation } });
      writeCachedContextPanel(cacheKey, result as never);
      return result;
    },
    initialData: cached as never,
    enabled: online || !!cached,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: online ? 1 : false,
  });

  if (!online && !data) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        You’re offline and “{term}” hasn’t been opened on this device yet. Its context will be
        available when you’re back online — the verse is still here in the meantime.
      </p>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-xs">Reading the passage for context…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Context for “{term}” could not be loaded right now. Close this panel and keep reading — the
        verse is still here.
      </p>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-xl border border-dashed bg-muted/40 p-3">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Generated context — no curated Atlas entry exists for this term yet. Check anything
          important against the passage itself.
        </p>
      </div>
      {data.blocks.map((block, i) => (
        <BlockView key={i} block={block} onOpenEntry={(id) => open({ kind: "entry", entryId: id })} />
      ))}
    </div>
  );
}

function PurposeBlock({
  entryId,
  artifactTitle,
  term,
  reference,
  verseText,
  fallback,
}: {
  entryId: string;
  artifactTitle: string;
  term: string;
  reference: string;
  verseText: string;
  fallback: string[];
}) {
  const fetchPurpose = useServerFn(getArtifactPurpose);
  const online = useOnline();
  const translation = useTranslationSetting();
  const cacheKey = purposeKey({ entryId, reference, term, translation });
  const cached = useMemo(() => readCachedPurpose(cacheKey), [cacheKey]);
  const { data, isPending } = useQuery({
    queryKey: ["artifact-purpose", cacheKey],
    queryFn: async (): Promise<CachedPurpose> => {
      const result = await fetchPurpose({
        data: { artifactTitle, term, reference, verseText, translation },
      });
      writeCachedPurpose(cacheKey, result);
      return result;
    },
    initialData: cached,
    // Offline, the curated fallback below stands in for a fresh generation.
    enabled: online || !!cached,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: online ? 1 : false,
  });

  const curated = contextualPurpose(entryId, { term, reference });
  const heading = `Purpose in ${reference}`;
  const body = data?.body ?? curated?.body ?? fallback;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {heading}
        </h3>
        {isPending && online && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      {body.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-foreground/90">
          {p}
        </p>
      ))}
    </section>
  );
}

export function AtlasPanel() {

  const { stack, back, close, open } = useAtlas();
  const top = stack[stack.length - 1];
  const [shared, setShared] = useState(false);
  const mobile = useIsMobile();

  if (!top) return null;

  const entry = top.kind === "entry" ? ENTRY_BY_ID[top.entryId] : undefined;
  // Offer the full-screen journey map when this entry has one, remembering the
  // exact verse so the reader can come straight back to it.
  const journey = entry ? JOURNEY_BY_ID[JOURNEY_FOR_ENTRY[entry.id] ?? ""] : undefined;
  const readerPath =
    typeof window === "undefined" ? "" : window.location.pathname.replace(/^\//, "");
  // People and places also have full pages of their own; offer them without
  // displacing the default "close and keep reading" flow.
  const entityName = entry?.title ?? (top.kind === "auto" ? top.term : "");
  // A grouped entry can match more than one place (e.g. Sychar within Samaria).
  // Prefer the actual tapped term when it resolves to a mapped place.
  const tappedPlace = top.kind === "entry" && entry?.kind === "place" && top.term
    ? entityByName(top.term)
    : undefined;
  const mappedTappedPlace = tappedPlace?.type === "place" && mapPlaceIdForEntity(tappedPlace)
    ? tappedPlace
    : undefined;
  const entityRef =
    mappedTappedPlace ??
    (entityName ? entityByName(entityName) : undefined) ??
    (entry?.matches ?? []).map((m) => entityByName(m)).find(Boolean);
  const tappedMapPlaceId = top.kind === "entry" && entry?.kind === "place" && top.term
    ? Object.values(MAP_FEATURE_BY_ID).find((feature) =>
        feature.id.toLowerCase() === top.term?.toLowerCase() ||
        feature.name.toLowerCase().split(" (")[0] === top.term?.toLowerCase(),
      )?.id
    : undefined;
  const mapPlaceId = tappedMapPlaceId ?? (entityRef?.type === "place" ? mapPlaceIdForEntity(entityRef) : undefined);
  const peekPlaceId = mobile && mapPlaceId && MAP_FEATURE_BY_ID[mapPlaceId] && top.kind === "entry" ? mapPlaceId : undefined;
  const title = entry
    ? entry.title
    : top.kind === "auto"
      ? top.term
      : top.kind === "lexicon"
        ? top.word
        : "Context";
  const subtitle = entry
    ? entry.subtitle
    : top.kind === "auto" || top.kind === "lexicon"
      ? top.reference
      : "";
  const badge = entry ? KIND_LABEL[entry.kind] : top.kind === "lexicon" ? "Original language" : "Context";

  return (
    <Dialog open modal={mobile} onOpenChange={(isOpen) => { if (!isOpen) close(); }}>
      <DialogContent
        showOverlay={mobile}
        showClose={false}
        className="inset-x-0 bottom-0 left-0 top-auto z-50 flex max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-t-lg border-x-0 border-b-0 bg-surface-raised p-0 shadow-2xl [animation:sheet-up_260ms_cubic-bezier(0.32,0.72,0,1)] lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:w-[440px] lg:rounded-none lg:border-l lg:border-t-0 lg:[animation:panel-in_220ms_ease]"
      >
        <DialogTitle className="sr-only">{title} — Atlas context</DialogTitle>
        <DialogDescription className="sr-only">Biblical context for the selected word, person, place, or theme.</DialogDescription>
        {peekPlaceId ? (
          <Suspense fallback={<div className="h-[54dvh] bg-land" aria-label="Loading map" />}>
            <PlaceMapPeek placeId={peekPlaceId} from={readerPath} onClose={close} />
          </Suspense>
        ) : <>
        <header className="flex items-start gap-3 border-b px-4 py-3">
          {stack.length > 1 && (
            <button
              type="button"
              onClick={back}
              aria-label="Back"
              className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              {badge}
            </p>
            <h2 className="scripture truncate text-xl leading-tight text-foreground">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              // Deep link: the chapter the reader is on, with this panel re-opened.
              const url = new URL(window.location.href);
              if (top.kind === "entry") url.searchParams.set("ref", top.entryId);
              url.searchParams.set("s", "share");
              const link = url.toString();
              trackShare("share_opened", { resourceType: "entry", resourceRef: title });
              const copyFallback = () => {
                void navigator.clipboard?.writeText(link);
                trackShare("share_sent", { channel: "copy", resourceType: "entry", resourceRef: title });
                setShared(true);
                setTimeout(() => setShared(false), 1600);
              };
              void nativeShare({ title: `${title} — Bible Atlas`, url: link }).then((done) => {
                if (done)
                  trackShare("share_sent", {
                    channel: "native",
                    resourceType: "entry",
                    resourceRef: title,
                  });
                else copyFallback();
              });
            }}

            aria-label={`Share ${title}`}
            title="Share this context"
            className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
          >
            {shared ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close and continue reading"
            className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {stack.length > 1 && (
          <nav className="flex flex-wrap items-center gap-1 border-b px-4 py-1.5 text-[11px] text-muted-foreground">
            {stack.map((s, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="opacity-50">→</span>}
                <span className={i === stack.length - 1 ? "text-foreground" : ""}>
                  {s.kind === "entry"
                    ? (ENTRY_BY_ID[s.entryId]?.title ?? s.entryId)
                    : s.kind === "lexicon"
                      ? s.word
                      : s.term}
                </span>
              </span>
            ))}
          </nav>
        )}

        <div className="flex-1 space-y-7 overflow-y-auto px-4 py-5">
          {journey && (
            <Link
              to="/journeys/$journey"
              params={{ journey: journey.id }}
              search={readerPath ? { from: readerPath } : {}}
              className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3.5 py-3 transition-colors hover:bg-muted"
            >
              <MapIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">
                  Explore interactive map
                </span>
                <span className="block text-xs text-muted-foreground">{journey.tagline}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>
          )}
          {!journey && mapPlaceId && (
            <Link
              to="/maps"
              search={readerPath ? { place: mapPlaceId, from: readerPath } : { place: mapPlaceId }}
              className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3.5 py-3 transition-colors hover:bg-muted"
            >
              <MapIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">Explore interactive map</span>
                <span className="block text-xs text-muted-foreground">Open {entityRef?.name ?? title} with nearby places and journeys</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>
          )}
          {entityRef && (
            <Link
              to={entityRef.type === "person" ? "/people/$slug" : "/places/$slug"}
              params={{ slug: entityRef.slug }}
              search={{}}
              className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3.5 py-3 transition-colors hover:bg-muted"
            >
              <BookMarked className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-sm font-medium text-foreground">
                  {entityRef.name}: full page
                </span>
                <span className="block text-xs text-muted-foreground">
                  {entityRef.type === "person"
                    ? "Story, every verse, journeys and timeline"
                    : "Location, archaeology and every verse"}
                </span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>
          )}
          {entry
            ? [
                ...entry.blocks,
                ...(NODE_BY_ENTRY[entry.id]
                  ? [
                      {
                        type: "connections" as const,
                        heading: "Threads across Scripture",
                        caption: "Where this moment is picked up elsewhere in the story.",
                        nodeId: NODE_BY_ENTRY[entry.id].id,
                      },
                    ]
                  : []),
              ].map((block, i) => {
                if (
                  block.type === "prose" &&
                  /^purpose/i.test(block.heading) &&
                  top.kind === "entry" &&
                  top.term &&
                  top.reference &&
                  top.verseText
                ) {
                  return (
                    <PurposeBlock
                      key={i}
                      entryId={entry.id}
                      artifactTitle={entry.title}
                      term={top.term}
                      reference={top.reference}
                      verseText={top.verseText}
                      fallback={block.body}
                    />
                  );
                }
                return (
                  <BlockView
                    key={i}
                    block={block}
                    onOpenEntry={(id) => open({ kind: "entry", entryId: id })}
                  />
                );
              })
            : top.kind === "auto" ? (
                <AiPanelBody term={top.term} reference={top.reference} verseText={top.verseText} />
              ) : top.kind === "lexicon" ? (
                <LexiconCard
                  word={top.word}
                  reference={top.reference}
                  verseText={top.verseText}
                  onNavigate={close}
                />
              ) : null}


          <button
            type="button"
            onClick={close}
            className="w-full rounded-xl border border-dashed py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            Close and continue reading
          </button>
        </div>
        </>}
      </DialogContent>
    </Dialog>
  );
}
