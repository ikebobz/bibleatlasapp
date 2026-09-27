/** AI fallback for connections that are not authored in the graph. */

import { sharedAi, tokensOf } from "@/lib/ai/context-service.server";

export type { ThreadInsight } from "./insight-cache";
import type { ThreadInsight } from "./insight-cache";

const SYSTEM = `You are the thematic-connections layer of a Bible reading app.
Given a biblical event, person, symbol or teaching, explain how it connects to the rest of Scripture:
what it echoes earlier, what it anticipates later, and the theological thread that ties them together.
Be historically careful and non-sectarian; note where a link is a widely-read pattern rather than an explicit citation.
Reply with JSON only, no markdown fence:
{"paragraphs":[string],"links":[{"ref":"Book 1:1","note":string}]}
2-3 paragraphs of 2-4 sentences, up to 6 links.`;

export async function generateThreadInsight(input: {
  label: string;
  reference: string;
  summary: string;
  known: string[];
}): Promise<ThreadInsight> {
  return sharedAi<ThreadInsight>({
    feature: "thread",
    surface: "threads.insight",
    entity: input.label,
    reference: input.reference,
    model: "google/gemini-2.5-flash",
    validate: (insight) => !!insight?.paragraphs?.length,
    generate: (report) => callModel(input, report),
  });
}

async function callModel(
  input: { label: string; reference: string; summary: string; known: string[] },
  report: { tokens: number },
): Promise<ThreadInsight> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI connections are not configured");


  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Subject: ${input.label} (${input.reference})\nSummary: ${input.summary}\nAlready covered in the app, do not repeat these: ${input.known.join("; ") || "none"}\nSurface further connections across the Old and New Testaments.`,
        },
      ],
    }),
  });

  if (res.status === 429) throw new Error("Too many requests just now — try again in a moment.");
  if (res.status === 402) throw new Error("AI credits are exhausted for this workspace.");
  if (!res.ok) throw new Error(`Connections unavailable (${res.status})`);

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  report.tokens = tokensOf(json);
  const raw = (json.choices?.[0]?.message?.content ?? "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: { paragraphs?: string[]; links?: { ref?: string; note?: string }[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Connections could not be read");
    parsed = JSON.parse(raw.slice(start, end + 1));
  }

  const insight: ThreadInsight = {
    paragraphs: (parsed.paragraphs ?? []).filter(Boolean).slice(0, 4),
    links: (parsed.links ?? [])
      .filter((l) => l.ref)
      .slice(0, 6)
      .map((l) => ({ ref: l.ref!, note: l.note ?? "" })),
    generated: true,
  };
  return insight;
}
