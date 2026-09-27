/**
 * Builds and reads the daily verse entry.
 *
 * Church seasons take priority. Outside them, the Scripture *reference* is
 * mirrored from Joseph Prince Ministries' Daily Grace Inspirations feed — the
 * reference and title only. The devotional prose is copyrighted, so Bible
 * Atlas never reproduces it; the notification links back to the source and
 * renders the verse from its own public-domain translation.
 */

import { parseReference } from "@/lib/bible";
import { loadChapter } from "@/lib/chapter.server";
import { DEFAULT_TRANSLATION, isTranslationId, type TranslationId } from "@/lib/translations";
import { fallbackFor } from "./fallback";
import { seasonFor, seasonReading } from "./seasons";

const FEED_URL = "https://www.josephprince.org/blog/daily-grace-inspirations";
const FEED_ORIGIN = "https://www.josephprince.org";

export type DailyVerseRow = {
  day: string;
  source: string;
  title: string;
  book: string;
  chapter: number;
  verse: number;
  end_verse: number | null;
  season: string | null;
  source_url: string | null;
};

export function todayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function dayMsFor(day: string): number {
  return Date.parse(`${day}T00:00:00Z`);
}

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&apos;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type FeedEntry = { title: string; ref: string; url: string };

/** Pull the newest card's title, reference and permalink. */
export async function fetchFeedEntry(): Promise<FeedEntry | null> {
  let html = "";
  try {
    const res = await fetch(FEED_URL, {
      headers: { accept: "text/html", "user-agent": "BibleAtlas/1.0 (+https://mybibleatlas.com)" },
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  }

  const card = html.split('class="card  card--dgi')[1];
  if (!card) return null;

  const href = card.match(/href="(\/blog\/daily-grace-inspirations\/[^"]+)"/)?.[1];
  const title = card.match(/class="card__title"[^>]*>([\s\S]*?)</)?.[1];
  const ref = card.match(/class="card__verseRef"[^>]*>([\s\S]*?)</)?.[1];
  if (!title || !ref) return null;

  return {
    title: decode(title),
    ref: decode(ref).replace(/[–—]/g, "-"),
    url: href ? `${FEED_ORIGIN}${href}` : FEED_URL,
  };
}

/** Resolve what today's entry should be, without touching the database. */
export async function resolveDaily(day: string): Promise<Omit<DailyVerseRow, "day"> & { day: string }> {
  const dayMs = dayMsFor(day);
  const hit = seasonFor(dayMs);

  if (hit) {
    const reading = seasonReading(hit);
    const parsed = parseReference(reading.ref);
    if (parsed) {
      return {
        day,
        source: "seasonal",
        title: reading.title,
        book: parsed.book,
        chapter: parsed.chapter,
        verse: parsed.verse ?? 1,
        end_verse: null,
        season: hit.label,
        source_url: null,
      };
    }
  }

  const entry = await fetchFeedEntry();
  if (entry) {
    const parsed = parseReference(entry.ref);
    const endVerse = entry.ref.match(/:\d+\s*-\s*(\d+)/)?.[1];
    if (parsed) {
      return {
        day,
        source: "mirror",
        title: entry.title,
        book: parsed.book,
        chapter: parsed.chapter,
        verse: parsed.verse ?? 1,
        end_verse: endVerse ? Number(endVerse) : null,
        season: null,
        source_url: entry.url,
      };
    }
  }

  const fallback = fallbackFor(dayMs);
  const parsed = parseReference(fallback.ref)!;
  return {
    day,
    source: "fallback",
    title: fallback.title,
    book: parsed.book,
    chapter: parsed.chapter,
    verse: parsed.verse ?? 1,
    end_verse: null,
    season: null,
    source_url: null,
  };
}

export type DailyPayload = {
  title: string;
  reference: string;
  text: string;
  path: string;
  season: string | null;
  sourceUrl: string | null;
  translation: TranslationId;
};

/** Turn a stored row into the notification payload, verse text included. */
export async function renderDaily(
  row: DailyVerseRow,
  translationInput?: string,
): Promise<DailyPayload> {
  const translation: TranslationId = isTranslationId(translationInput)
    ? translationInput
    : DEFAULT_TRANSLATION;

  let text = "";
  let reference = "";
  try {
    const chapter = await loadChapter(row.book, row.chapter, translation);
    const last = row.end_verse ?? row.verse;
    const verses = chapter.verses.filter((v) => v.number >= row.verse && v.number <= last);
    text = verses.map((v) => v.text).join(" ");
    reference =
      `${chapter.bookName} ${row.chapter}:${row.verse}` +
      (row.end_verse && row.end_verse !== row.verse ? `-${row.end_verse}` : "");
  } catch {
    reference = `${row.book} ${row.chapter}:${row.verse}`;
  }

  return {
    title: row.season ? `${row.season} — ${row.title}` : row.title,
    reference,
    text,
    path: `/${row.book}/${row.chapter}?v=${row.verse}`,
    season: row.season,
    sourceUrl: row.source_url,
    translation,
  };
}
