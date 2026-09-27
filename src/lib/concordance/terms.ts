/** Client-safe helpers and curated term lists for the Concordance. */

export type FeaturedGroup = { label: string; blurb: string; terms: string[] };

export const FEATURED_GROUPS: FeaturedGroup[] = [
  {
    label: "Great themes",
    blurb: "Words that carry the storyline of Scripture from Genesis to Revelation.",
    terms: ["covenant", "grace", "faith", "righteousness", "glory", "mercy", "redemption", "holiness"],
  },
  {
    label: "People",
    blurb: "Follow a name through every book that mentions it.",
    terms: ["Abraham", "Moses", "David", "Elijah", "Mary", "Peter", "Paul", "Jesus"],
  },
  {
    label: "Places",
    blurb: "Every mention, with the map and journeys behind it.",
    terms: ["Jerusalem", "Egypt", "Babylon", "Bethlehem", "Galilee", "Sinai", "Antioch", "Rome"],
  },
  {
    label: "Worship and sacrifice",
    blurb: "The vocabulary of tabernacle, temple and altar.",
    terms: ["sacrifice", "altar", "priest", "tabernacle", "temple", "blood", "atonement", "passover"],
  },
];

export const POPULAR_TERMS = FEATURED_GROUPS.flatMap((g) => g.terms);

/** URL segment for a searched word: lowercase, hyphenated, safe. */
export function termSlug(term: string): string {
  return term
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 48);
}

/** Turn a URL segment back into a searchable phrase. */
export function slugToTerm(slug: string): string {
  return slug.replace(/-/g, " ").trim();
}

export function titleCase(term: string): string {
  return term.replace(/\b[a-z]/g, (c) => c.toUpperCase());
}
