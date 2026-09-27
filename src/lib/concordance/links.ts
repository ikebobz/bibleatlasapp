/**
 * Ties a concordance word back into the rest of Bible Atlas: the gazetteer
 * kind, mapped journeys, timeline moments and thematic connection nodes.
 */

import { GAZETTEER_PHRASES } from "@/lib/atlas/gazetteer";
import { JOURNEYS } from "@/lib/atlas/journeys";
import type { EntityKind } from "@/lib/atlas/types";
import { TIMELINE_ORDERED } from "@/lib/timeline/events";
import { THREAD_NODES } from "@/lib/threads/data";

export type AtlasLinks = {
  kind: EntityKind | null;
  journeys: { id: string; title: string; tagline: string }[];
  timeline: { id: string; date: string; title: string; summary: string; book: string; chapter: number }[];
  nodes: { id: string; label: string; summary: string; ref: string }[];
};

function norm(s: string) {
  return s.toLowerCase();
}

export function atlasLinksFor(term: string): AtlasLinks {
  const q = norm(term);
  if (q.length < 3) return { kind: null, journeys: [], timeline: [], nodes: [] };

  const gaz = GAZETTEER_PHRASES.find((g) => norm(g.term) === q);

  const journeys = JOURNEYS.filter((j) => {
    if (norm(j.title).includes(q) || norm(j.tagline).includes(q)) return true;
    return j.legs.some((leg) =>
      leg.stops.some((s) => norm(s.place) === q || norm(s.label ?? "") === q),
    );
  })
    .slice(0, 3)
    .map((j) => ({ id: j.id, title: j.title, tagline: j.tagline }));

  const timeline = TIMELINE_ORDERED.filter(
    (e) => norm(e.title).includes(q) || norm(e.summary).includes(q),
  )
    .slice(0, 4)
    .map((e) => ({
      id: e.id,
      date: e.date,
      title: e.title,
      summary: e.summary,
      book: e.link.book,
      chapter: e.link.chapter,
    }));

  const nodes = THREAD_NODES.filter(
    (n) => norm(n.label).includes(q) || norm(n.summary).includes(q),
  )
    .slice(0, 4)
    .map((n) => ({ id: n.id, label: n.label, summary: n.summary, ref: n.ref }));

  return { kind: gaz?.kind ?? null, journeys, timeline, nodes };
}

export const KIND_LABEL: Record<EntityKind, string> = {
  person: "Person",
  place: "Place",
  people: "People group",
  journey: "Journey",
  event: "Event",
  object: "Object",
  covenant: "Covenant",
  prophecy: "Prophecy",
  miracle: "Miracle",
  concept: "Concept",
};
