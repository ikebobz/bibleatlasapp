/** Shared shape for the original-language (Hebrew / Greek) lexicon layer. */

export type LexWord = {
  original: string;
  transliteration: string;
  gloss: string;
};

export type LexOccurrence = {
  ref: string;
  note: string;
};

export type Lexeme = {
  /** The English word the reader tapped, echoed back. */
  word: string;
  language: "Hebrew" | "Greek" | "Aramaic";
  original: string;
  transliteration: string;
  /** Written pronunciation guide, e.g. "ah-GAH-pay". */
  pronunciation: string;
  /** Strong's number when confident, else empty. */
  strongs: string;
  /** One-line original meaning. */
  gloss: string;
  /** Fuller range of meaning. */
  senses: string[];
  root: LexWord | null;
  occurrences: LexOccurrence[];
  related: LexWord[];
  /** Caveat or uncertainty note, may be empty. */
  note: string;
};

export const LEX_EMPTY: Lexeme = {
  word: "",
  language: "Greek",
  original: "",
  transliteration: "",
  pronunciation: "",
  strongs: "",
  gloss: "",
  senses: [],
  root: null,
  occurrences: [],
  related: [],
  note: "",
};
