import { getBook } from "@/lib/bible";
import { entityBySlug } from "@/lib/entities/registry";
import { isLangCode, type LangCode } from "@/lib/lang-routes";

export type ReaderReturn = {
  kind: "reader";
  label: string;
  book: string;
  chapter: string;
  verse: string | null;
  lang?: LangCode;
};

/** "genesis/12/1" → { label: "Genesis 12:1", book: "genesis", chapter: "12", verse: "1" } */
export function readerReturn(from: string): ReaderReturn | null {
  const parts = from.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const lang = isLangCode(parts[0]) ? parts[0] : undefined;
  if (lang) parts.shift();
  const book = getBook(parts[0]);
  const chapter = Number(parts[1]);
  if (!book || !Number.isFinite(chapter)) return null;
  const verse = parts[2] && Number.isFinite(Number(parts[2])) ? Number(parts[2]) : null;
  return {
    kind: "reader",
    label: `${book.name} ${chapter}${verse ? `:${verse}` : ""}`,
    book: book.id,
    chapter: String(chapter),
    verse: verse ? String(verse) : null,
    ...(lang ? { lang } : {}),
  };
}

export type MapSectionPath = "/maps" | "/journeys" | "/timeline" | "/concordance" | "/connections" | "/places" | "/people" | "/highlights" | "/install";

export type MapReturn =
  | ReaderReturn
  | { kind: "place" | "person"; label: string; slug: string }
  | { kind: "section"; label: string; path: MapSectionPath };

const SECTIONS: Record<string, { label: string; path: MapSectionPath }> = {
  maps: { label: "All maps", path: "/maps" },
  journeys: { label: "All journeys", path: "/journeys" },
  timeline: { label: "Timeline", path: "/timeline" },
  concordance: { label: "Concordance", path: "/concordance" },
  connections: { label: "Connections", path: "/connections" },
  places: { label: "Places", path: "/places" },
  people: { label: "People", path: "/people" },
  highlights: { label: "Highlights", path: "/highlights" },
  install: { label: "Install", path: "/install" },
};

/** Parses a deliberately narrow internal return path; external redirects are rejected. */
export function mapReturn(from: string): MapReturn | null {
  const clean = from.split(/[?#]/, 1)[0]?.replace(/^\/+|\/+$/g, "") ?? "";
  const reader = readerReturn(clean);
  if (reader) return reader;
  const parts = clean.split("/").filter(Boolean);
  if ((parts[0] === "places" || parts[0] === "people") && parts.length === 2 && /^[a-z0-9-]+$/.test(parts[1])) {
    const kind = parts[0] === "places" ? "place" : "person";
    const named = entityBySlug(kind, parts[1]);
    return { kind, label: named?.name ?? (kind === "place" ? "Place" : "Person"), slug: parts[1] };
  }
  const section = parts.length === 1 ? SECTIONS[parts[0]] : undefined;
  return section ? { kind: "section", ...section } : null;
}
