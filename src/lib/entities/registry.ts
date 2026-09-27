/**
 * The people and places index behind `/people/[slug]` and `/places/[slug]`.
 *
 * Names come from the reader's gazetteer, so anything the reader can highlight
 * has a page to link to. Only names with hand-written context in
 * `./copy` are `published` — those get indexed and listed in the sitemap; the
 * rest render the same page but are marked `noindex, follow` so thin entries
 * never dilute the indexed set.
 */

import { GAZETTEER_PHRASES } from "@/lib/atlas/gazetteer";
import { PLACES as GEO_PLACES } from "@/lib/atlas/geo";
import { PEOPLE_COPY, PLACES_COPY, type CuratedPerson, type CuratedPlace } from "./copy";

export type EntityType = "person" | "place";

export type Entity = {
  type: EntityType;
  slug: string;
  name: string;
  /** True when hand-written context exists, i.e. the page is worth indexing. */
  published: boolean;
  curated: CuratedPerson | CuratedPlace | null;
  /** Concordance query that actually returns this entity's verses. */
  search: string;
  /** Names that redirect-by-link to this entity (alternate spellings, titles). */
  aliases: string[];
  /** Map coordinates when the Atlas gazetteer has them (places only). */
  geo?: { lon: number; lat: number };
};

const SMALL_WORDS = new Set(["of", "the", "and", "in"]);

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** A single-word concordance query that reliably matches the entity. */
function defaultSearch(name: string): string {
  const words = name.split(/\s+/).filter((w) => !SMALL_WORDS.has(w.toLowerCase()));
  return (words.at(-1) ?? name).replace(/['’]s$/, "");
}

function geoFor(slug: string): { lon: number; lat: number } | undefined {
  const hit = GEO_PLACES[slug];
  return hit ? { lon: hit.lon, lat: hit.lat } : undefined;
}

function build(): {
  people: Entity[];
  places: Entity[];
  bySlug: Map<string, Entity>;
  byName: Map<string, Entity>;
} {
  const bySlug = new Map<string, Entity>();
  const byName = new Map<string, Entity>();

  const add = (entity: Entity) => {
    bySlug.set(`${entity.type}:${entity.slug}`, entity);
    // Alternate spellings resolve to the same entity, whose canonical URL the
    // page then points at, so "/people/abram" never becomes a rival page.
    for (const alias of entity.aliases) {
      const key = `${entity.type}:${slugify(alias)}`;
      if (!bySlug.has(key)) bySlug.set(key, entity);
    }
    for (const alias of [entity.name, ...entity.aliases]) {
      const key = alias.toLowerCase();
      if (!byName.has(key)) byName.set(key, entity);
    }
  };

  // Curated entries first: they own their aliases, so "Abram" resolves to
  // Abraham's page rather than creating a second, emptier one.
  for (const [slug, copy] of Object.entries(PEOPLE_COPY)) {
    const name = titleFromSlug(slug);
    add({
      type: "person",
      slug,
      name,
      published: true,
      curated: copy,
      search: copy.search ?? defaultSearch(name),
      aliases: copy.also ?? [],
    });
  }
  for (const [slug, copy] of Object.entries(PLACES_COPY)) {
    const name = titleFromSlug(slug);
    add({
      type: "place",
      slug,
      name,
      published: true,
      curated: copy,
      search: copy.search ?? defaultSearch(name),
      aliases: copy.also ?? [],
      geo: geoFor(slug),
    });
  }

  // Everything else the reader can highlight gets a page too, unindexed.
  for (const term of GAZETTEER_PHRASES) {
    if (term.kind !== "person" && term.kind !== "place") continue;
    if (byName.has(term.term.toLowerCase())) continue;
    const type: EntityType = term.kind;
    const slug = slugify(term.term);
    if (!slug || bySlug.has(`${type}:${slug}`)) continue;
    add({
      type,
      slug,
      name: term.term,
      published: false,
      curated: null,
      search: defaultSearch(term.term),
      aliases: [],
      ...(type === "place" ? { geo: geoFor(slug) } : {}),
    });
  }

  // Alias keys point at the same entity, so de-duplicate before listing:
  // otherwise Abraham appears twice in /people and twice in the sitemap.
  const all = [...new Set(bySlug.values())];
  const sort = (a: Entity, b: Entity) => a.name.localeCompare(b.name);
  return {
    people: all.filter((e) => e.type === "person").sort(sort),
    places: all.filter((e) => e.type === "place").sort(sort),
    bySlug,
    byName,
  };
}

const INDEX = build();

export const PEOPLE = INDEX.people;
export const PLACES = INDEX.places;

export const PUBLISHED_PEOPLE = PEOPLE.filter((e) => e.published);
export const PUBLISHED_PLACES = PLACES.filter((e) => e.published);

export function entityBySlug(type: EntityType, slug: string): Entity | undefined {
  return INDEX.bySlug.get(`${type}:${slug.toLowerCase()}`);
}

/** Resolve a name the reader highlighted (or a concordance word) to a page. */
export function entityByName(name: string): Entity | undefined {
  return INDEX.byName.get(name.trim().toLowerCase());
}

/** A placeholder entity so an unknown slug still renders instead of 404-ing. */
export function provisionalEntity(type: EntityType, slug: string): Entity {
  const name = titleFromSlug(slug);
  return {
    type,
    slug,
    name,
    published: false,
    curated: null,
    search: defaultSearch(name),
    aliases: [],
    ...(type === "place" ? { geo: geoFor(slug) } : {}),
  };
}

export function entityPath(entity: Pick<Entity, "type" | "slug">): string {
  return entity.type === "person" ? `/people/${entity.slug}` : `/places/${entity.slug}`;
}
