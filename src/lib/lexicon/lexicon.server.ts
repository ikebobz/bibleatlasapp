/**
 * Original-language layer: given an English word and the verse it sits in,
 * produce the Hebrew/Greek lexeme behind it.
 *
 * The WEB text served by bible-api has no Strong's tagging, so the record is
 * generated on demand and cached (bounded in-memory here, localStorage on the
 * client) so the same word in the same verse is always answered identically.
 */

import type { Lexeme, LexOccurrence, LexWord } from "./types";
import { sharedAi, tokensOf } from "@/lib/ai/context-service.server";

const SYSTEM = `You are the original-languages layer of a Bible reading app. A reader tapped one English word in one specific verse of the World English Bible.
Identify the Hebrew (or Aramaic) or Greek word that stands behind THAT English word in THAT verse — not the word in general, and not a different passage.
Old Testament verses are Hebrew/Aramaic; New Testament verses are Greek.
Be a careful lexicographer: give the lexical (dictionary) form in the original script, a scholarly transliteration, a plain English pronunciation guide using hyphenated syllables with the stressed syllable in capitals, the Strong's number only when you are confident, the core meaning, and the range of meaning.
If the English word renders no single original word (an added helper word like "the", "is", "of"), say so in "note" and still give the closest original form if there is one, otherwise leave "original" empty.
Never invent occurrences: only cite references you are confident about, and prefer Genesis, Exodus, Matthew, Mark, Luke, John and Acts.
Reply with JSON only, no markdown fence, exactly this shape:
{"language":"Hebrew"|"Aramaic"|"Greek","original":string,"transliteration":string,"pronunciation":string,"strongs":string,"gloss":string,"senses":[string],"root":{"original":string,"transliteration":string,"gloss":string}|null,"occurrences":[{"ref":"John 3:16","note":string}],"related":[{"original":string,"transliteration":string,"gloss":string}],"note":string}
gloss under 90 characters. 2-5 senses, each a short phrase. Up to 5 occurrences, each note under 90 characters. Up to 4 related words. note may be an empty string.`;

type RawWord = { original?: string; transliteration?: string; gloss?: string };

function cleanWord(w: RawWord | null | undefined): LexWord | null {
  if (!w || !w.original) return null;
  return {
    original: String(w.original),
    transliteration: String(w.transliteration ?? ""),
    gloss: String(w.gloss ?? ""),
  };
}

export async function generateLexeme(input: {
  word: string;
  reference: string;
  verseText: string;
  translation?: string;
}): Promise<Lexeme> {
  return sharedAi<Lexeme>({
    feature: "lexicon",
    surface: "lexicon.lexeme",
    entity: input.word,
    reference: input.reference,
    translation: input.translation,
    model: "google/gemini-2.5-flash",
    validate: (lexeme) => !!lexeme?.word,
    generate: (report) => callModel(input, report),
  });
}

async function callModel(
  input: { word: string; reference: string; verseText: string },
  report: { tokens: number },
): Promise<Lexeme> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Original languages are not configured");


  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Verse: ${input.reference} — "${input.verseText}"\nThe reader tapped the English word: "${input.word}"\nWhat is the original-language word behind it here?`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Too many lookups right now — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
    throw new Error(`Lexicon unavailable (${res.status}): ${body.slice(0, 160)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  report.tokens = tokensOf(json);
  const raw = json.choices?.[0]?.message?.content ?? "";
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Lexicon entry could not be read");
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  }

  const language =
    parsed.language === "Hebrew" || parsed.language === "Aramaic" ? parsed.language : "Greek";

  const senses = Array.isArray(parsed.senses)
    ? (parsed.senses as unknown[]).map((s) => String(s)).filter(Boolean).slice(0, 6)
    : [];

  const occurrences: LexOccurrence[] = Array.isArray(parsed.occurrences)
    ? (parsed.occurrences as { ref?: string; note?: string }[])
        .filter((o) => o?.ref)
        .map((o) => ({ ref: String(o.ref), note: String(o.note ?? "") }))
        .slice(0, 6)
    : [];

  const related: LexWord[] = Array.isArray(parsed.related)
    ? (parsed.related as RawWord[])
        .map(cleanWord)
        .filter((w): w is LexWord => w !== null)
        .slice(0, 5)
    : [];

  const lexeme: Lexeme = {
    word: input.word,
    language,
    original: String(parsed.original ?? ""),
    transliteration: String(parsed.transliteration ?? ""),
    pronunciation: String(parsed.pronunciation ?? ""),
    strongs: String(parsed.strongs ?? ""),
    gloss: String(parsed.gloss ?? ""),
    senses,
    root: cleanWord(parsed.root as RawWord),
    occurrences,
    related,
    note: String(parsed.note ?? ""),
  };

  return lexeme;

}

/**
 * Speak a transliterated word. Returns base64 mp3 so the client can play it
 * from a data URL without another round trip.
 *
 * Cached in the shared table so the first reader pays for a word once and
 * every later reader — on any device — is served for free.
 */
export async function speakWord(text: string): Promise<{ audio: string; mime: string }> {
  return sharedAi<{ audio: string; mime: string }>({
    feature: "audio",
    surface: "lexicon.speech",
    entity: text,
    model: "openai/gpt-4o-mini-tts",
    validate: (spoken) => !!spoken?.audio,
    generate: () => speakUncached(text),
  });
}

async function speakUncached(text: string): Promise<{ audio: string; mime: string }> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("Audio is not configured");


  const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-tts",
      input: text,
      voice: "alloy",
      response_format: "mp3",
      speed: 0.85,
      instructions:
        "Pronounce this single ancient Hebrew or Greek word slowly and clearly, as a lexicon audio sample. Say it once.",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Pronunciation unavailable (${res.status}): ${body.slice(0, 160)}`);
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return { audio: btoa(binary), mime: "audio/mpeg" };
}
