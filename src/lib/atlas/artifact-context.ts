/**
 * Verse-aware purpose notes.
 *
 * Some artifact entries — coins above all — are triggered by many different
 * words in very different passages. Showing the same three bullets every time
 * is wrong: the denarius in Matthew 22 is a different point from the widow's
 * lepta in Mark 12. This module picks the purpose text that belongs to the
 * word the reader actually clicked, falling back to the entry's general notes.
 */

export type PurposeContext = {
  /** The exact phrase clicked in the text. */
  term?: string;
  /** Human reference of the verse, e.g. "Mark 12:42". */
  reference?: string;
};

type Rule = {
  /** Lowercase phrases that select this note. */
  match: string[];
  /** Optional book restriction (lowercase book name prefix of the reference). */
  book?: string;
  heading: string;
  body: string[];
};

const COIN_RULES: Rule[] = [
  {
    match: ["denarius", "denarii", "tribute money", "tax money", "penny", "pence"],
    heading: "Why this coin, here",
    body: [
      "A denarius was a full day in the field. When it appears, the question is usually what a day of a life is worth — wages in the vineyard, oil and wine priced in a famine, or the cost of caring for a wounded stranger.",
      "It also carried Caesar's head and his divine title, which is why handling one in Jerusalem was never a neutral act.",
    ],
  },
  {
    match: ["mite", "mites", "lepta", "lepton", "small copper coins", "farthing"],
    heading: "Why this coin, here",
    body: [
      "The lepton was the smallest coin minted — two of them barely bought bread. The point of the passage is proportion, not amount: what is given measured against what is left.",
      "Jesus is watching the treasury when he says the widow put in more than all the rest.",
    ],
  },
  {
    match: ["pieces of silver", "thirty pieces", "thirty shekels"],
    heading: "Why this coin, here",
    body: [
      "Thirty shekels of silver was the fixed compensation in the Law for a slave killed by an ox — a legal price tag on a life.",
      "Quoting that figure is the point: it is the sum the prophets named, and the sum a friend accepted.",
    ],
  },
  {
    match: ["shekel", "shekels", "half shekel", "didrachma", "temple tax", "stater"],
    heading: "Why this coin, here",
    body: [
      "The shekel is a weight before it is a coin, and in the temple it is the unit of assessment: redemption money, vows, sanctuary dues, the half-shekel every man owed.",
      "Only Tyrian silver was accepted at the temple, which is what put money changers in the courts at all.",
    ],
  },
  {
    match: ["talent", "talents", "mina", "minas", "pound", "pounds"],
    heading: "Why this coin, here",
    body: [
      "A talent is a fortune — roughly six thousand days of wages — and a mina about three months'. When Jesus uses them in parables the figures are deliberately outsized.",
      "The scale is the argument: a debt no servant could repay, or a trust far larger than the servant expected.",
    ],
  },
  {
    match: ["silver", "gold", "money", "coin", "coins", "purse", "bag of money"],
    heading: "Why this money, here",
    body: [
      "Weight and metal, not a stamped face, decide value here: silver is counted out on scales for land, dowries, offerings and debts.",
      "Read the sum against a labourer's day — about a shekel every four days — to feel what the passage is describing.",
    ],
  },
];

const RULES: Record<string, Rule[]> = {
  coins: COIN_RULES,
};

/** Returns verse-specific purpose text, or null to keep the entry's default. */
export function contextualPurpose(
  artifactId: string,
  ctx: PurposeContext,
): { heading: string; body: string[] } | null {
  const rules = RULES[artifactId];
  if (!rules || !ctx.term) return null;
  const term = ctx.term.toLowerCase();
  const book = ctx.reference?.toLowerCase() ?? "";
  const hit = rules.find(
    (r) => (!r.book || book.startsWith(r.book)) && r.match.some((m) => term.includes(m)),
  );
  if (!hit) return null;
  const heading = ctx.reference ? `${hit.heading} — ${ctx.reference}` : hit.heading;
  return { heading, body: hit.body };
}
