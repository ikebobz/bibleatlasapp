import { memo, useCallback, useState } from "react";
import { Box, MapPin } from "lucide-react";
import { MeasureTip, type MeasureAnchor } from "./MeasureTip";
import { LexiconTip, type LexiconAnchor } from "./LexiconTip";
import { HighlightMenu, type HighlightAnchor } from "./HighlightMenu";
import { ShareSheet } from "./ShareSheet";
import { shareVerse } from "@/lib/share";
import { trackShare } from "@/lib/analytics/share-events";
import { useSettings } from "./settings";
import { useHighlights, type HighlightColor } from "@/lib/highlights";
import { annotateVerse } from "@/lib/atlas/match";
import { useAtlas } from "@/components/atlas/AtlasContext";
import type { EntityKind } from "@/lib/atlas/types";
import type { ReaderCue } from "@/lib/atlas/entry-index.generated";


const KIND_COLOR: Record<EntityKind, string> = {
  person: "text-[var(--color-person)]",
  place: "text-[var(--color-place)]",
  people: "text-[var(--color-place)]",
  journey: "text-[var(--color-place)]",
  event: "text-[var(--color-event)]",
  object: "text-[var(--color-event)]",
  covenant: "text-[var(--color-theme)]",
  prophecy: "text-[var(--color-theme)]",
  miracle: "text-[var(--color-theme)]",
  concept: "text-[var(--color-theme)]",
};

type Props = {
  book: string;
  bookName: string;
  chapter: number;
  number: number;
  text: string;
  /** True for the verse the reader navigated to (deep link, selector, share). */
  focused?: boolean;
};

const WORD_RE = /[A-Za-z][A-Za-z'’-]*/g;

function ContextCue({ cue }: { cue?: ReaderCue }) {
  if (!cue?.map && !cue?.model3d) return null;
  const Icon = cue.model3d ? Box : MapPin;
  return <span aria-hidden="true" className="inline-block whitespace-nowrap align-baseline text-[0.6em] opacity-65">{'\u2060'}<Icon className="ml-0.5 inline-block h-[0.85em] w-[0.85em] align-baseline" strokeWidth={1.8} /></span>;
}

function contextLabel(value: string, cue?: ReaderCue) {
  if (cue?.model3d) return `${value} — view 3D model and context`;
  if (cue?.map) return `${value} — open map${cue.archaeology ? " and archaeological context" : ""}`;
  return `${value} — open context`;
}

function VerseImpl({ book, bookName, chapter, number, text, focused }: Props) {
  const { open, activeVerse } = useAtlas();
  const { originalLanguage, translation } = useSettings();
  const [anchor, setAnchor] = useState<MeasureAnchor | null>(null);
  const [lexAnchor, setLexAnchor] = useState<LexiconAnchor | null>(null);
  const [hlAnchor, setHlAnchor] = useState<HighlightAnchor | null>(null);
  const [shareAnchor, setShareAnchor] = useState<DOMRect | null>(null);
  const highlights = useHighlights();
  const highlight = highlights.get(book, chapter, number);
  const closeTip = useCallback(() => setAnchor(null), []);
  const closeLex = useCallback(() => setLexAnchor(null), []);
  const closeHl = useCallback(() => setHlAnchor(null), []);
  const closeShare = useCallback(() => setShareAnchor(null), []);

  const segments = annotateVerse(text, { book, chapter, verse: number });
  const reference = `${bookName} ${chapter}:${number}`;
  const sharePayload = { book, chapter, verse: number, text, reference, translation };

  const openLexicon = useCallback(
    (word: string, el: HTMLElement) => {
      setAnchor(null);
      setLexAnchor({ word, reference, verseText: text, rect: el.getBoundingClientRect() });
    },
    [reference, text],
  );

  /** With the language layer on, every plain word becomes a lexicon trigger. */
  const renderText = (value: string, keyPrefix: string) => {
    if (!originalLanguage) return <span key={keyPrefix}>{value}</span>;
    const out: React.ReactNode[] = [];
    let cursor = 0;
    let m: RegExpExecArray | null;
    WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(value)) !== null) {
      if (m.index > cursor) out.push(<span key={`${keyPrefix}-t${cursor}`}>{value.slice(cursor, m.index)}</span>);
      const word = m[0];
      out.push(
        <button
          key={`${keyPrefix}-w${m.index}`}
          type="button"
          className="lex-word"
          onClick={(e) => openLexicon(word, e.currentTarget as HTMLElement)}
        >
          {word}
        </button>,
      );
      cursor = m.index + word.length;
    }
    if (cursor < value.length) out.push(<span key={`${keyPrefix}-t${cursor}`}>{value.slice(cursor)}</span>);
    return <span key={keyPrefix}>{out}</span>;
  };

  return (
    <span
      id={`v${number}`}
      tabIndex={focused ? -1 : undefined}
      aria-current={focused ? "location" : undefined}
      aria-label={focused ? `${reference} — current verse` : undefined}
      className={
        "transition-colors " +
        (focused ? "verse-focus " : "") +
        (activeVerse === number ? "verse-active " : "") +
        (highlight ? `verse-highlight hl-${highlight.color}` : "")
      }
    >

      <sup className="scripture mr-1 select-none align-super text-[0.62em]">
        <button
          type="button"
          aria-label={`Highlight ${reference}`}
          className="cursor-pointer rounded px-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={(e) => {
            setAnchor(null);
            setLexAnchor(null);
            setHlAnchor({
              rect: (e.currentTarget as HTMLElement).getBoundingClientRect(),
              current: highlight?.color,
            });
          }}
        >
          {number}
        </button>
      </sup>
      {segments.map((seg, i) => {
        if (seg.type === "text") return renderText(seg.value, `s${i}`);
        if (seg.type === "measure") {
          return (
            <button
              key={i}
              type="button"
              className="atlas-ref text-[var(--color-event)] decoration-dashed"
              onClick={(e) => {
                setLexAnchor(null);
                setAnchor({
                  measureId: seg.measureId,
                  rect: (e.currentTarget as HTMLElement).getBoundingClientRect(),
                });
              }}
            >
              {seg.value}
            </button>
          );
        }
        if (seg.type === "entry") {
          return (
            <button
              key={i}
              type="button"
              className={`atlas-ref ${KIND_COLOR[seg.kind]}`}
              aria-label={contextLabel(seg.value, seg.cue)}
              onClick={() =>
                open(
                  {
                    kind: "entry",
                    entryId: seg.entryId,
                    term: seg.value,
                    reference,
                    verseText: text,
                  },
                  number,
                )
              }
            >
              {seg.value}<ContextCue cue={seg.cue} />
            </button>
          );
        }
        return (
          <button
            key={i}
            type="button"
            className={
              "atlas-ref decoration-dotted " +
              (seg.kind ? KIND_COLOR[seg.kind] : "text-foreground/80")
            }
            aria-label={contextLabel(seg.value, seg.cue)}
            onClick={() => open({ kind: "auto", term: seg.value, reference, verseText: text }, number)}
          >
            {seg.value}<ContextCue cue={seg.cue} />
          </button>
        );

      })}{" "}
      {anchor && <MeasureTip anchor={anchor} onClose={closeTip} />}
      {lexAnchor && (
        <LexiconTip
          anchor={lexAnchor}
          onClose={closeLex}
          onExpand={(word) => {
            setLexAnchor(null);
            open({ kind: "lexicon", word, reference, verseText: text }, number);
          }}
        />
      )}
      {hlAnchor && (
        <HighlightMenu
          anchor={hlAnchor}
          reference={reference}
          onPick={(color: HighlightColor) => {
            highlights.set({ book, bookName, chapter, verse: number, color, text });
            setHlAnchor(null);
          }}
          onRemove={() => {
            highlights.remove(book, chapter, number);
            setHlAnchor(null);
          }}
          onCopy={() => {
            void navigator.clipboard?.writeText(`“${text}” — ${reference}`);
            setHlAnchor(null);
          }}
          onShare={() => {
            const rect = hlAnchor.rect;
            setHlAnchor(null);
            trackShare("share_opened", { resourceType: "verse", resourceRef: reference, translation });
            void shareVerse(sharePayload).then((done) => {
              if (done) trackShare("share_sent", { channel: "native", resourceRef: reference, translation });
              else setShareAnchor(rect);
            });
          }}
          onClose={closeHl}
        />
      )}
      {shareAnchor && (
        <ShareSheet
          verse={sharePayload}

          rect={shareAnchor}
          onClose={closeShare}
        />
      )}

    </span>
  );
}

export const Verse = memo(VerseImpl);
