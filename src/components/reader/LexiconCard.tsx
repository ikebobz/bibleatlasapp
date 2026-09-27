import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Volume2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { getLexeme, getPronunciationAudio } from "@/lib/lexicon/lexicon.functions";
import { lexemeKey, readCachedLexeme, writeCachedLexeme } from "@/lib/lexicon/cache";
import { readCachedSpeech, speechKey, writeCachedSpeech } from "@/lib/lexicon/speech-cache";
import type { Lexeme } from "@/lib/lexicon/types";
import { parseReference } from "@/lib/bible";
import { useOnline } from "@/lib/offline/useOnline";
import { useTranslationSetting } from "@/components/reader/settings";

function refTarget(ref: string) {
  const target = parseReference(ref);
  if (!target) return null;
  const verse = ref.match(/\d+\s*:\s*(\d+)/);
  return { ...target, verse: verse ? Number(verse[1]) : undefined };
}

const SILENT =
  "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInljyzsNRFLPWdnZGWrddDsjK1unuSrVN9jJsK8KuQtQCtMBjCEtImISdNKJOopIpBFpNSMbIHCSRpRR5iakjTiyzLhchUUBwCgyKiweBv/7UsQbg8isVNoMPMjAAAA0gAAABEVFGmgqK////9bP/6XCykxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

function isAudioUri(uri: string | null | undefined): uri is string {
  return !!uri && /^data:audio\/[a-z0-9.+-]+;base64,.{200,}$/i.test(uri);
}

function browserVoice(text: string, lang: string): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  const prefix = lang.slice(0, 2);
  const voice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (!voice) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.voice = voice;
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
  return true;
}

function SpeakButton({ text, original, language }: { text: string; original: string; language: string }) {
  const fetchAudio = useServerFn(getPronunciationAudio);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const cached = useRef<string | null>(null);
  const storeKey = speechKey(text);

  const play = useCallback(async () => {
    if (busy) return;
    setFailed(false);
    // Create and unlock the player inside the tap so Safari/iOS allow sound later.
    const audio = new Audio();
    audio.src = SILENT;
    audio.play().catch(() => {});
    setBusy(true);
    try {
      if (!isAudioUri(cached.current)) {
        const stored = readCachedSpeech(storeKey);
        cached.current = isAudioUri(stored) ? stored : null;
      }
      if (!cached.current) {
        const result = await fetchAudio({ data: { text } });
        const uri = `data:${result.mime};base64,${result.audio}`;
        if (!isAudioUri(uri)) throw new Error("empty audio");
        cached.current = uri;
        writeCachedSpeech(storeKey, uri);
      }
      audio.pause();
      audio.src = cached.current;
      await audio.play();
    } catch (err) {
      console.warn("[lexicon] pronunciation failed", err);
      const lang = language === "Greek" ? "el-GR" : "he-IL";
      if (!browserVoice(original || text, lang)) setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [busy, fetchAudio, storeKey, text, original, language]);

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={play}
        aria-label={`Hear ${text} pronounced`}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
      </button>
      {failed && (
        <span role="status" className="max-w-[8rem] text-right text-[10px] text-muted-foreground">
          Couldn’t play pronunciation
        </span>
      )}
    </div>
  );
}

/**
 * The original-language record for one English word in one verse: script,
 * transliteration, pronunciation, meaning range, root, occurrences, relatives.
 */
export function LexiconCard({
  word,
  reference,
  verseText,
  onPickWord,
  onNavigate,
}: {
  word: string;
  reference: string;
  verseText: string;
  /** Follow a root or related word without leaving the card. */
  onPickWord?: (word: string) => void;
  /** Close the overlay when an occurrence link is followed. */
  onNavigate?: () => void;
}) {
  const fetchLexeme = useServerFn(getLexeme);
  const translation = useTranslationSetting();
  const key = lexemeKey({ reference, word, translation });
  const cached = useMemo(() => readCachedLexeme(key), [key]);

  const online = useOnline();

  const { data, isPending, error } = useQuery<Lexeme>({
    queryKey: ["lexeme", key],
    queryFn: async () => {
      const result = await fetchLexeme({ data: { word, reference, verseText, translation } });
      writeCachedLexeme(key, result);
      return result;
    },
    initialData: cached,
    enabled: online || !!cached,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: online ? 1 : false,
  });

  if (!online && !data) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
        “{word}” hasn’t been looked up on this device yet, so its Hebrew/Greek entry will be
        available when you’re back online.
      </p>
    );
  }

  if (isPending && !data) {
    return (
      <div className="flex items-center gap-2 py-6 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Looking up “{word}” in the original…
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className="py-4 text-xs text-muted-foreground">
        The original-language entry for “{word}” could not be loaded right now.
      </p>
    );
  }


  const speakable = data.transliteration || data.original;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            {data.language}
            {data.strongs ? ` · ${data.strongs}` : ""}
          </p>
          {data.original && (
            <p
              className="scripture mt-0.5 text-3xl leading-tight text-foreground"
              lang={data.language === "Greek" ? "el" : "he"}
              dir={data.language === "Greek" ? "ltr" : "rtl"}
            >
              {data.original}
            </p>
          )}
          {data.transliteration && (
            <p className="text-sm italic text-foreground/80">{data.transliteration}</p>
          )}
          {data.pronunciation && (
            <p className="mt-0.5 text-xs tracking-wide text-muted-foreground">
              {data.pronunciation}
            </p>
          )}
        </div>
        {speakable && (
          <SpeakButton text={speakable} original={data.original} language={data.language} />
        )}
      </div>

      {data.gloss && <p className="text-sm leading-relaxed text-foreground/90">{data.gloss}</p>}

      {data.senses.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Range of meaning
          </h4>
          <ul className="mt-1.5 space-y-1">
            {data.senses.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-foreground/85">
                <span className="text-primary">·</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.root && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Root
          </h4>
          <button
            type="button"
            onClick={() => onPickWord?.(data.root!.transliteration || data.root!.original)}
            className="mt-1.5 w-full rounded-lg border bg-card px-2.5 py-2 text-left transition-colors hover:border-primary/40"
          >
            <span className="scripture text-base text-foreground">{data.root.original}</span>
            {data.root.transliteration && (
              <span className="ml-2 text-xs italic text-muted-foreground">
                {data.root.transliteration}
              </span>
            )}
            {data.root.gloss && (
              <span className="mt-0.5 block text-xs text-muted-foreground">{data.root.gloss}</span>
            )}
          </button>
        </section>
      )}

      {data.occurrences.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Other occurrences
          </h4>
          <ul className="mt-1.5 divide-y rounded-lg border bg-card">
            {data.occurrences.map((o, i) => {
              const target = refTarget(o.ref);
              const inner = (
                <>
                  <span className="scripture text-xs text-primary">{o.ref}</span>
                  {o.note && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{o.note}</span>
                  )}
                </>
              );
              return (
                <li key={i} className="px-2.5 py-1.5">
                  {target ? (
                    <Link
                      to="/$book/$chapter"
                      params={{ book: target.book, chapter: String(target.chapter) }}
                      search={target.verse ? { v: target.verse } : {}}
                      onClick={onNavigate}
                      className="block"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <span className="block">{inner}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {data.related.length > 0 && (
        <section>
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Related words
          </h4>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {data.related.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPickWord?.(r.transliteration || r.original)}
                title={r.gloss}
                className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <span className="scripture text-foreground">{r.original}</span>
                {r.transliteration && <span className="ml-1.5 italic">{r.transliteration}</span>}
              </button>
            ))}
          </div>
        </section>
      )}

      {data.note && (
        <p className="rounded-lg border border-dashed p-2.5 text-[11px] leading-relaxed text-muted-foreground">
          {data.note}
        </p>
      )}
    </div>
  );
}
