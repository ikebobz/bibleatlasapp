import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Loader2,
  Repeat,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { getBook, stepChapter } from "@/lib/bible";
import { audioForTranslation } from "@/lib/audio-bibles";
import { useSettings } from "./settings";
import { useAudioBar } from "./audio-bar-context";
import { useChapterRoute } from "./use-chapter-route";
import { Button } from "@/components/ui/button";

const SPEEDS = [1, 1.25, 1.5] as const;

function fmt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Pulls the streamable URL out of the API.Bible audio-chapter payload. */
function pickUrl(payload: unknown): string | null {
  const data = (payload as { data?: Record<string, unknown> } | null)?.data;
  if (!data) return null;
  for (const key of ["resourceUrl", "audioUrl", "url", "path"]) {
    const v = data[key];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

export function AudioPlayer() {
  // `strict: false` — this lives in the root layout and renders under any route.
  const params = useParams({ strict: false }) as {
    book?: string;
    chapter?: string;
  };
  const book = params.book && getBook(params.book) ? getBook(params.book)!.id : null;
  const chapter = params.chapter ? Number(params.chapter) : NaN;
  const active = Boolean(book) && Number.isFinite(chapter) && chapter > 0;

  const { translation } = useSettings();
  const mapping = audioForTranslation(translation);
  const bookMeta = book ? getBook(book) : undefined;
  const inScope =
    !!mapping && (mapping.scope === "full" || bookMeta?.testament === "new");

  const navigate = useNavigate();
  const chapterRoute = useChapterRoute();
  const { setBridge, combined, setCombined } = useAudioBar();
  const [autoplay, setAutoplay] = useState(true);
  /** Set only when a track ends, so we resume playback after auto-advance. */
  const resumeRef = useRef(false);
  const [expanded, setExpanded] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable" | "no-translation-audio" | "error"
  >("idle");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  const audioBibleId = mapping?.audioBibleId ?? null;
  /** Last chapter key we resolved (or are resolving) — blocks duplicate fetches. */
  const lastFetchedRef = useRef<string | null>(null);
  /** Session-lifetime client cache of resolved audio URLs. */
  const urlCacheRef = useRef<Map<string, string | null>>(new Map());

  /** Chapter keys we've already retried with a fresh link this session. */
  const retriedRef = useRef<Set<string>>(new Set());
  /**
   * A signed link can expire between resolving and playing. Ask the server
   * once for a brand-new link before telling the reader audio failed.
   */
  const handleAudioError = useCallback(() => {
    const key = `${book}-${chapter}-${audioBibleId}`;
    if (!book || !audioBibleId || retriedRef.current.has(key)) {
      setStatus("error");
      return;
    }
    retriedRef.current.add(key);
    const wasPlaying = !audioRef.current?.paused || resumeRef.current;
    setStatus("loading");
    fetch("/api/public/get-audio-chapter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookSlug: book, chapterNumber: chapter, audioBibleId, fresh: true }),
    })
      .then(async (res) => (res.ok ? pickUrl(await res.json()) : null))
      .then((url) => {
        if (!url) return setStatus("error");
        urlCacheRef.current.set(key, url);
        resumeRef.current = wasPlaying;
        setSrc(url);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, [book, chapter, audioBibleId]);

  useEffect(() => {
    if (!active) return;

    if (!mapping) {
      lastFetchedRef.current = null;
      setSrc(null);
      setStatus("no-translation-audio");
      return;
    }
    if (!inScope) {
      lastFetchedRef.current = null;
      setSrc(null);
      setStatus("unavailable");
      return;
    }

    const key = `${book}-${chapter}-${audioBibleId}`;
    if (lastFetchedRef.current === key) return;
    lastFetchedRef.current = key;

    let cancelled = false;
    setSrc(null);
    setPlaying(false);
    setTime(0);
    setDuration(0);

    const cached = urlCacheRef.current.get(key);
    if (cached !== undefined) {
      if (!cached) {
        setStatus("unavailable");
      } else {
        setSrc(cached);
        setStatus("ready");
      }
      return;
    }

    setStatus("loading");

    fetch("/api/public/get-audio-chapter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookSlug: book,
        chapterNumber: chapter,
        audioBibleId,
      }),
    })
      .then(async (res) => (res.ok ? pickUrl(await res.json()) : null))
      .then((url) => {
        urlCacheRef.current.set(key, url ?? null);
        if (cancelled) return;
        if (!url) {
          setStatus("unavailable");
          return;
        }
        setSrc(url);
        setStatus("ready");
      })
      .catch(() => {
        // Allow a retry on the next navigation to this chapter.
        if (lastFetchedRef.current === key) lastFetchedRef.current = null;
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [active, book, chapter, audioBibleId, inScope, mapping]);


  // Never autoplay on load. Playback only resumes after a track ended and the
  // player auto-advanced to the next chapter.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !src) return;
    el.playbackRate = speed;
    if (!resumeRef.current) return;
    resumeRef.current = false;
    el.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) el.play().then(() => setPlaying(true), () => setPlaying(false));
    else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    setBridge({ playing, status, toggle, options: expanded, setOptions: setExpanded });
    return () => setBridge(null);
  }, [active, playing, status, toggle, expanded, setBridge]);

  useEffect(() => {
    if (playing && active) setCombined(true);
  }, [playing, active, setCombined]);

  // Publishes the bar's real height so page content can reserve exactly that
  // much space — the bar wraps to two or three rows on narrow phones.
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    const root = document.documentElement;
    if (!el || !active) {
      root.style.removeProperty("--audio-bar-h");
      return;
    }
    const publish = () =>
      root.style.setProperty(
        "--audio-bar-h",
        `${combined && window.matchMedia("(max-width: 767px)").matches ? 0 : Math.ceil(el.getBoundingClientRect().height)}px`,
      );
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    window.addEventListener("orientationchange", publish);
    window.addEventListener("resize", publish);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", publish);
      window.removeEventListener("resize", publish);
      root.style.removeProperty("--audio-bar-h");
    };
  }, [active, status, expanded, combined]);

  if (!active) return null;

  const disabled = status !== "ready";

  function handleEnded() {
    setPlaying(false);
    if (!autoplay || !book) return;
    const next = stepChapter(book, chapter, 1);
    resumeRef.current = true;
    // stepChapter returns null past Revelation 22, so playback simply stops.
    if (!next) return;
    navigate({
      to: chapterRoute,
      params: { book: next.book, chapter: String(next.chapter) },
    });
  }

  function skip(by: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(el.currentTime + by, 0), el.duration || 0);
  }

  const skipControls = (
    <>
      <button
        type="button"
        onClick={() => skip(-15)}
        disabled={disabled}
        aria-label="Back 15 seconds"
        title="Back 15 seconds"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => skip(15)}
        disabled={disabled}
        aria-label="Forward 15 seconds"
        title="Forward 15 seconds"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        <RotateCw className="h-4 w-4" />
      </button>
    </>
  );

  const extraControls = (
    <>
      {SPEEDS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setSpeed(s)}
          aria-pressed={speed === s}
          className={
            "min-h-11 rounded-full px-3 py-1 text-[11px] font-medium transition-colors " +
            (speed === s
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {s}x
        </button>
      ))}
      <button
        type="button"
        onClick={() => setAutoplay((v) => !v)}
        aria-pressed={autoplay}
        aria-label={autoplay ? "Turn off autoplay" : "Turn on autoplay"}
        title={autoplay ? "Autoplay on — continues to next chapter" : "Autoplay off"}
        className={
          "inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors " +
          (autoplay
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground")
        }
      >
        <Repeat className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          el.muted = !el.muted;
          setMuted(el.muted);
        }}
        disabled={disabled}
        aria-label={muted ? "Unmute" : "Mute"}
        title={muted ? "Unmute" : "Mute"}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </>
  );


  return (
    <div
      ref={barRef}
      className={(combined ? "max-md:pointer-events-none max-md:border-0 max-md:bg-transparent max-md:pb-0 max-md:backdrop-blur-none " : "") + "fixed bottom-0 left-0 z-40 w-full border-t bg-background/95 pb-[max(0.25rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80"}
    >
      <div className={(combined ? "max-md:hidden " : "") + "mx-auto flex max-w-3xl flex-nowrap items-center gap-x-2 px-4 py-2 sm:gap-x-3"}>
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          title={
            status === "no-translation-audio"
              ? "No audio available for this translation"
              : status === "unavailable"
              ? "Audio available for New Testament books"
              : status === "error"
                ? "Audio couldn’t be loaded"
                : playing
                ? "Pause"
                : "Play chapter audio"
          }
          aria-label={playing ? "Pause chapter audio" : "Play chapter audio"}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        <div className="hidden shrink-0 items-center gap-1 sm:flex">{skipControls}</div>

        {status === "unavailable" || status === "error" || status === "no-translation-audio" ? (
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">
            {status === "error"
              ? "Audio couldn’t be played on this device"
              : status === "no-translation-audio"
                ? "No audio available for this translation"
                : "Audio available for New Testament books"}
          </p>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
              {fmt(time)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={time}
              disabled={disabled}
              aria-label="Seek"
              onChange={(e) => {
                const next = Number(e.target.value);
                setTime(next);
                if (audioRef.current) audioRef.current.currentTime = next;
              }}
              className="h-1 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary disabled:opacity-40"
            />
            <span className="w-10 shrink-0 text-[11px] tabular-nums text-muted-foreground">
              {fmt(duration)}
            </span>
          </div>
        )}

        <div className="hidden shrink-0 items-center gap-1 sm:flex">{extraControls}</div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide audio options" : "Show audio options"}
          title={expanded ? "Hide audio options" : "Show audio options"}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground sm:hidden"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

       {expanded ? (
        <div className={(combined ? "max-md:hidden " : "") + "mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-1 px-4 pb-2 md:hidden"}>
          {skipControls}
          {extraControls}
        </div>
      ) : null}

       {combined && expanded && (
         <div className="pointer-events-auto fixed inset-x-0 z-40 border-t bg-background px-3 py-2 shadow-lg md:hidden" style={{ bottom: "var(--chapter-nav-h, 0px)" }}>
           <div className="mx-auto flex max-w-md items-center gap-2">
             <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{fmt(time)}</span>
             <input type="range" min={0} max={duration || 0} step={1} value={time} disabled={disabled} aria-label="Seek audio" onChange={(e) => { const next = Number(e.target.value); setTime(next); if (audioRef.current) audioRef.current.currentTime = next; }} className="min-w-0 flex-1 accent-primary" />
             <span className="w-10 text-xs tabular-nums text-muted-foreground">{fmt(duration)}</span>
             <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={() => setExpanded(false)} aria-label="Close audio options"><ChevronDown /></Button>
           </div>
           <div className="flex flex-wrap items-center justify-center gap-1">{skipControls}{extraControls}</div>
         </div>
       )}
       <audio
        ref={audioRef}
        src={src ?? undefined}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
        onError={handleAudioError}
        className="hidden"
      />
    </div>
  );
}
