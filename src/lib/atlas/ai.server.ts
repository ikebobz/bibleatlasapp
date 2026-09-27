import { sharedAi, tokensOf } from "@/lib/ai/context-service.server";
import type { Block } from "./types";


export type AiPanel = {
  title: string;
  subtitle: string;
  blocks: Block[];
  generated: true;
};

type AiShape = {
  title?: string;
  subtitle?: string;
  sections?: { heading?: string; body?: string }[];
  facts?: { label?: string; value?: string }[];
  refs?: { ref?: string; note?: string }[];
};

const SYSTEM = `You are the contextual layer of a Bible reading app. A reader has tapped a word while reading a verse.
Write concise, historically careful notes that help them understand THIS verse better, then return to reading.
Be factual and non-sectarian. Never invent archaeology or dates you are unsure of; say what is uncertain.
Reply with JSON only, no markdown fence, using this shape:
{"title":string,"subtitle":string,"sections":[{"heading":string,"body":string}],"facts":[{"label":string,"value":string}],"refs":[{"ref":"Book 1:1","note":string}]}
Keep subtitle under 90 characters, 2-4 sections of 2-4 sentences, up to 5 facts, up to 6 refs.`;

export async function generateContext(input: {
  term: string;
  reference: string;
  verseText: string;
  translation?: string;
}): Promise<AiPanel> {
  return sharedAi<AiPanel>({
    feature: "context",
    surface: "atlas.context",
    entity: input.term,
    reference: input.reference,
    translation: input.translation,
    model: "google/gemini-2.5-flash",
    validate: (panel) => !!panel?.blocks?.length,
    generate: (report) => callModel(input, report),
  });
}

async function callModel(
  input: { term: string; reference: string; verseText: string },
  report: { tokens: number },
): Promise<AiPanel> {
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
          content: `Verse: ${input.reference} — "${input.verseText}"\nThe reader tapped: "${input.term}"\nExplain who or what this is and why it matters here.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Context unavailable (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  report.tokens = tokensOf(json);
  const raw = json.choices?.[0]?.message?.content ?? "";
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  // Models sometimes emit raw newlines/tabs inside string values, which is
  // invalid JSON. Escape control characters that appear inside strings.
  const escapeControls = (text: string) => {
    let out = "";
    let inString = false;
    let escaped = false;
    for (const ch of text) {
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') inString = false;
        else if (ch < " ") {
          out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : ch === "\t" ? "\\t" : " ";
          continue;
        }
      } else if (ch === '"') inString = true;
      out += ch;
    }
    return out;
  };
  const tryParse = (text: string): AiShape | null => {
    try {
      return JSON.parse(escapeControls(text)) as AiShape;
    } catch {
      return null;
    }
  };

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const parsed =
    tryParse(cleaned) ?? (start !== -1 && end > start ? tryParse(cleaned.slice(start, end + 1)) : null);
  if (!parsed) throw new Error("Context could not be read");

  const blocks: Block[] = [];
  for (const s of parsed.sections ?? []) {
    if (!s.body) continue;
    blocks.push({
      type: "prose",
      heading: s.heading || "Context",
      body: s.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    });
  }
  const facts = (parsed.facts ?? []).filter((f) => f.label && f.value);
  if (facts.length) {
    blocks.push({
      type: "facts",
      heading: "At a glance",
      items: facts.map((f) => ({ label: f.label!, value: f.value! })),
    });
  }
  const refs = (parsed.refs ?? []).filter((r) => r.ref);
  if (refs.length) {
    blocks.push({
      type: "refs",
      heading: "Related passages",
      items: refs.map((r) => ({ ref: r.ref!, note: r.note ?? "" })),
    });
  }

  const panel: AiPanel = {
    title: parsed.title || input.term,
    subtitle: parsed.subtitle || `Context for ${input.reference}`,
    blocks,
    generated: true,
  };
  return panel;


}
