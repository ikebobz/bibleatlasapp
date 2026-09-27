import { ATLAS_INDEX, MAPPED_GAZETTEER_TERMS, type AtlasIndexEntry, type ReaderCue } from "./entry-index.generated";
import { GAZETTEER_PHRASES } from "./gazetteer";
import { MEASURES } from "./measures";
import type { EntityKind } from "./types";

export type Segment =
  | { type: "text"; value: string }
  | { type: "entry"; value: string; entryId: string; kind: AtlasIndexEntry["kind"]; cue?: ReaderCue }
  | { type: "auto"; value: string; kind?: EntityKind; cue?: ReaderCue }
  | { type: "measure"; value: string; measureId: string };


export type VerseContext = { book: string; chapter: number; verse: number };

function inScope(entry: AtlasIndexEntry, ctx: VerseContext): boolean {
  if (!entry.scope || entry.scope.length === 0) return true;
  return entry.scope.some(
    (s) => s.book === ctx.book && (s.chapter === undefined || s.chapter === ctx.chapter),
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Phrase = { phrase: string; entry: AtlasIndexEntry };

const ALL_PHRASES: Phrase[] = ATLAS_INDEX.flatMap((entry) =>
  entry.matches.map((phrase) => ({ phrase, entry })),
).sort((a, b) => b.phrase.length - a.phrase.length);

/** Words that look like names but should never become Atlas references. */
const AUTO_STOPWORDS = new Set(
  [
    "god",
    "lord",
    "yahweh",
    "the",
    "a",
    "an",
    "and",
    "but",
    "then",
    "now",
    "so",
    "when",
    "for",
    "behold",
    "he",
    "she",
    "it",
    "they",
    "we",
    "i",
    "you",
    "his",
    "her",
    "their",
    "this",
    "that",
    "there",
    "these",
    "those",
    "in",
    "on",
    "at",
    "of",
    "to",
    "from",
    "with",
    "by",
    "all",
    "let",
    "if",
    "as",
    "after",
    "before",
    "no",
    "not",
    "yes",
    "why",
    "how",
    "what",
    "who",
    "spirit",
    "father",
    "son",
    "holy",
    "amen",
    "verily",
    "most",
    "high",
    "almighty",
    "sir",
    "rabbi",
    "teacher",
    "master",
    "king",
    "day",
    "night",
    "one",
    "two",
    "three",
    "surely",
    "truly",
    "therefore",
    "because",
    "while",
    "yet",
    "again",
    "behold,",
    "leave",
    "see",
    "please",
    "south",
    "north",
    "east",
    "west",
    "come",
    "go",
    "look",
    "listen",
    "arise",
    "take",
    "give",
  ].map((w) => w.toLowerCase()),
);

/** Currency, weights and measures resolve to a small conversion overlay. */
const MEASURE_PHRASES: { phrase: string; measureId: string }[] = MEASURES.flatMap((m) =>
  m.matches.map((phrase) => ({ phrase, measureId: m.id })),
).sort((a, b) => b.phrase.length - a.phrase.length);

const AUTO_PATTERN = /\b[A-Z][a-z]{2,}(?:\s+of\s+[A-Z][a-z]{2,})?\b/g;

/** Capitalisation at the start of a sentence carries no signal, so skip it. */
function isSentenceInitial(text: string, start: number): boolean {
  for (let i = start - 1; i >= 0; i--) {
    const ch = text[i];
    if (ch === " " || ch === "\n" || ch === "“" || ch === '"' || ch === "‘" || ch === "'" || ch === "(")
      continue;
    return ".?!;:,—".includes(ch);
  }
  return true;
}


type Match = { start: number; end: number; seg: Segment };

/** Verse annotations are stable, so memoise them across re-renders. */
const annotationCache = new Map<string, Segment[]>();

/**
 * Turn a verse into segments: plain text, authored Atlas references, and
 * detected proper nouns that fall back to on-demand context.
 */
export function annotateVerse(text: string, ctx: VerseContext): Segment[] {
  // Include the verse text so a translation switch never reuses another version's tokens.
  const cacheKey = `${ctx.book}:${ctx.chapter}:${ctx.verse}:${text.length}:${text.slice(0, 24)}`;
  const cached = annotationCache.get(cacheKey);
  if (cached) return cached;

  const lower = text.toLowerCase();
  const taken: boolean[] = new Array(text.length).fill(false);
  const matches: Match[] = [];


  const claim = (start: number, end: number) => {
    for (let i = start; i < end; i++) if (taken[i]) return false;
    for (let i = start; i < end; i++) taken[i] = true;
    return true;
  };

  for (const { phrase, entry } of ALL_PHRASES) {
    if (!inScope(entry, ctx)) continue;
    const re = new RegExp(`(^|[^A-Za-z’'])(${escapeRegExp(phrase)})(?![A-Za-z’'])`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index + m[1].length;
      const end = start + m[2].length;
      if (claim(start, end)) {
        matches.push({
          start,
          end,
          seg: {
            type: "entry", value: text.slice(start, end), entryId: entry.id, kind: entry.kind,
            cue: entry.model3d ? { model3d: true } : entry.mappedMatches?.[phrase.toLowerCase()],
          },
        });
      }
      re.lastIndex = end;
    }
  }

  for (const { phrase, measureId } of MEASURE_PHRASES) {
    const re = new RegExp(`(^|[^A-Za-z’'])(${escapeRegExp(phrase)})(?![A-Za-z’'])`, "gi");
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(text)) !== null) {
      const start = mm.index + mm[1].length;
      const end = start + mm[2].length;
      if (claim(start, end)) {
        matches.push({
          start,
          end,
          seg: { type: "measure", value: text.slice(start, end), measureId },
        });
      }
      re.lastIndex = end;
    }
  }

  // Canon-wide name index: recognises people, places, peoples, objects,
  // festivals, laws, prophecies, miracles and parables in any book.
  for (const { term, kind } of GAZETTEER_PHRASES) {
    if (!lower.includes(term.toLowerCase())) continue;
    const re = new RegExp(`(^|[^A-Za-z’'])(${escapeRegExp(term)})(?![A-Za-z’'])`, "gi");
    let gm: RegExpExecArray | null;
    while ((gm = re.exec(text)) !== null) {
      const start = gm.index + gm[1].length;
      const end = start + gm[2].length;
      if (claim(start, end)) {
        matches.push({ start, end, seg: {
          type: "auto", value: text.slice(start, end), kind,
          cue: kind === "place" ? MAPPED_GAZETTEER_TERMS[term.toLowerCase()] : undefined,
        } });
      }
      re.lastIndex = end;
    }
  }

  let am: RegExpExecArray | null;

  AUTO_PATTERN.lastIndex = 0;
  while ((am = AUTO_PATTERN.exec(text)) !== null) {
    const value = am[0];
    const head = value.split(/\s+/)[0].toLowerCase();
    if (AUTO_STOPWORDS.has(head) || AUTO_STOPWORDS.has(value.toLowerCase())) continue;
    const start = am.index;
    if (isSentenceInitial(text, start)) continue;
    const end = start + value.length;

    if (claim(start, end)) {
      matches.push({ start, end, seg: { type: "auto", value } });
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start > cursor) out.push({ type: "text", value: text.slice(cursor, m.start) });
    out.push(m.seg);
    cursor = m.end;
  }
  if (cursor < text.length) out.push({ type: "text", value: text.slice(cursor) });
  if (annotationCache.size > 4000) annotationCache.clear();
  annotationCache.set(cacheKey, out);
  return out;

}
