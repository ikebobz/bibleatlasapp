/**
 * Verse-specific purpose notes for artifact entries (coins, the ark, the veil…).
 *
 * The curated entry text is generic by necessity — one entry is triggered by
 * dozens of different words in very different passages. This generates the
 * "Purpose" section from the exact verse the reader clicked.
 */

import { sharedAi, tokensOf } from "@/lib/ai/context-service.server";

export type ArtifactPurpose = { heading: string; body: string[] };

const SYSTEM = `You are the contextual layer of a Bible reading app. A reader tapped an object or unit of money while reading one specific verse.
Write the "purpose" note for THAT verse only: what this object or coin is doing in this passage, and why the detail matters to the sense of the verse.
Never give a generic survey of the object across the whole Bible, and never describe a different passage than the one given.
Be factual, historically careful and non-sectarian. Say plainly when something is uncertain.
Reply with JSON only, no markdown fence: {"body":[string, string]} — 2 or 3 paragraphs, each 1-3 sentences.`;

export async function generatePurpose(input: {
  artifactTitle: string;
  term: string;
  reference: string;
  verseText: string;
  translation?: string;
}): Promise<ArtifactPurpose> {
  return sharedAi<ArtifactPurpose>({
    feature: "purpose",
    surface: "atlas.purpose",
    entity: `${input.artifactTitle}|${input.term}`,
    reference: input.reference,
    translation: input.translation,
    model: "google/gemini-2.5-flash",
    validate: (purpose) => !!purpose?.body?.length,
    generate: (report) => callModel(input, report),
  });
}

async function callModel(
  input: { artifactTitle: string; term: string; reference: string; verseText: string },
  report: { tokens: number },
): Promise<ArtifactPurpose> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI context is not configured");


  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Atlas entry: ${input.artifactTitle}\nVerse: ${input.reference} — "${input.verseText}"\nThe reader tapped: "${input.term}"\nWhy is this here, in this verse?`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Purpose unavailable (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  report.tokens = tokensOf(json);
  const raw = (json.choices?.[0]?.message?.content ?? "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: { body?: string[] };
  try {
    parsed = JSON.parse(raw) as { body?: string[] };
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Purpose could not be read");
    parsed = JSON.parse(raw.slice(start, end + 1)) as { body?: string[] };
  }

  const body = (parsed.body ?? []).map((p) => String(p).trim()).filter(Boolean);
  if (!body.length) throw new Error("Purpose could not be read");

  const purpose: ArtifactPurpose = {
    heading: `Purpose in ${input.reference}`,
    body,
  };
  return purpose;

}
