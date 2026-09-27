/**
 * API.Bible (American Bible Society) adapter for licensed translations.
 *
 * Only used for versions that carry an `apiBibleId`. The key is a server
 * secret and never reaches the browser; text is fetched per request and never
 * redistributed in bulk, which is what the licence terms require.
 */

import { getBook } from "./bible";

const BASE = "https://api.scripture.api.bible/v1";
const TIMEOUT_MS = 4000;

/** Book ids API.Bible uses (USFM), keyed by our internal book id. */
const USFM: Record<string, string> = {
  genesis: "GEN", exodus: "EXO", leviticus: "LEV", numbers: "NUM", deuteronomy: "DEU",
  joshua: "JOS", judges: "JDG", ruth: "RUT", "1-samuel": "1SA", "2-samuel": "2SA",
  "1-kings": "1KI", "2-kings": "2KI", "1-chronicles": "1CH", "2-chronicles": "2CH",
  ezra: "EZR", nehemiah: "NEH", esther: "EST", job: "JOB", psalms: "PSA",
  proverbs: "PRO", ecclesiastes: "ECC", "song-of-solomon": "SNG", isaiah: "ISA",
  jeremiah: "JER", lamentations: "LAM", ezekiel: "EZK", daniel: "DAN", hosea: "HOS",
  joel: "JOL", amos: "AMO", obadiah: "OBA", jonah: "JON", micah: "MIC", nahum: "NAM",
  habakkuk: "HAB", zephaniah: "ZEP", haggai: "HAG", zechariah: "ZEC", malachi: "MAL",
  matthew: "MAT", mark: "MRK", luke: "LUK", john: "JHN", acts: "ACT", romans: "ROM",
  "1-corinthians": "1CO", "2-corinthians": "2CO", galatians: "GAL", ephesians: "EPH",
  philippians: "PHP", colossians: "COL", "1-thessalonians": "1TH",
  "2-thessalonians": "2TH", "1-timothy": "1TI", "2-timothy": "2TI", titus: "TIT",
  philemon: "PHM", hebrews: "HEB", james: "JAS", "1-peter": "1PE", "2-peter": "2PE",
  "1-john": "1JN", "2-john": "2JN", "3-john": "3JN", jude: "JUD", revelation: "REV",
};

export function usfmFor(bookId: string): string | undefined {
  return USFM[bookId];
}

/**
 * Split API.Bible plain-text chapter output ("[1] text [2] text") into verses.
 *
 * Paraphrases such as The Message merge verses and mark them as a range
 * ("[1-2] text"). The merged text is kept once, on the first verse of the
 * range, which is how print editions present it.
 */
function parseVerses(content: string): { number: number; text: string }[] {
  const out: { number: number; text: string }[] = [];
  const re = /\[(\d+)(?:\s*-\s*\d+)?\]\s*([\s\S]*?)(?=\[\d+(?:\s*-\s*\d+)?\]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const number = Number(m[1]);
    const text = String(m[2] ?? "").replace(/\s+/g, " ").trim();
    if (number && text && !out.some((v) => v.number === number)) out.push({ number, text });
  }
  return out;
}


/** Fetch one chapter of a licensed translation. */
export async function fromApiBible(
  bookId: string,
  chapter: number,
  bibleId: string,
): Promise<{ number: number; text: string }[]> {
  const apiKey = process.env["API_BIBLE_KEY"];
  if (!apiKey) throw new Error("API.Bible key is not configured");
  const usfm = usfmFor(bookId);
  if (!usfm) throw new Error(`No API.Bible book id for ${bookId}`);
  // Sanity check that the chapter exists in our canon before spending a call.
  const book = getBook(bookId);
  if (!book || chapter < 1 || chapter > book.chapters) throw new Error("Chapter out of range");

  const url =
    `${BASE}/bibles/${bibleId}/chapters/${usfm}.${chapter}` +
    `?content-type=text&include-notes=false&include-titles=false` +
    `&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;

  const res = await fetch(url, {
    headers: { "api-key": apiKey, accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`API.Bible responded ${res.status}`);
  const json = (await res.json()) as { data?: { content?: string } };
  return parseVerses(String(json.data?.content ?? ""));
}

/** Our internal book id for an API.Bible USFM code. */
const FROM_USFM: Record<string, string> = Object.fromEntries(
  Object.entries(USFM).map(([id, usfm]) => [usfm, id]),
);

export function bookIdForUsfm(usfm: string): string | undefined {
  return FROM_USFM[usfm.toUpperCase()];
}

type ApiBibleSearchVerse = {
  bookId?: string;
  chapterId?: string;
  reference?: string;
  text?: string;
};

/**
 * Full-text search inside a licensed / catalogue translation.
 *
 * API.Bible returns verse ids as `BOOK.CHAPTER.VERSE`, which we map back onto
 * our own book ids so results link straight into the reader.
 */
export async function searchApiBible(
  query: string,
  bibleId: string,
  limit = 25,
): Promise<{ book: string; bookName: string; chapter: number; verse: number; reference: string; text: string }[]> {
  const apiKey = process.env["API_BIBLE_KEY"];
  if (!apiKey) throw new Error("API.Bible key is not configured");

  const url =
    `${BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}` +
    `&limit=${Math.min(100, Math.max(limit, 25))}&sort=canonical`;
  const res = await fetch(url, {
    headers: { "api-key": apiKey, accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 400 || res.status === 404) return [];
  if (!res.ok) throw new Error(`Search failed (${res.status})`);

  const json = (await res.json()) as {
    data?: { verses?: ApiBibleSearchVerse[] };
  };
  const rows = json.data?.verses ?? [];

  const { bookName } = await import("./bible");
  const { cleanSearchText } = await import("./search.server");

  const out: {
    book: string;
    bookName: string;
    chapter: number;
    verse: number;
    reference: string;
    text: string;
  }[] = [];

  for (const row of rows) {
    const usfm = String(row.bookId ?? "");
    const id = usfm ? bookIdForUsfm(usfm) : undefined;
    if (!id) continue;
    const book = getBook(id);
    if (!book) continue;
    // `chapterId` is "GEN.40"; the verse number comes from the reference tail.
    const chapter = Number(String(row.chapterId ?? "").split(".")[1]);
    const verse = Number(String(row.reference ?? "").match(/(\d+)\s*$/)?.[1]);
    if (!chapter || !verse || chapter > book.chapters) continue;
    const text = cleanSearchText(String(row.text ?? ""));
    if (!text) continue;
    out.push({
      book: id,
      bookName: bookName(id),
      chapter,
      verse,
      reference: `${bookName(id)} ${chapter}:${verse}`,
      text,
    });
    if (out.length >= limit) break;
  }
  return out;
}
