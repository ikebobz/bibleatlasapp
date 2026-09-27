/** Thematic connection graph: nodes are moments in Scripture, edges are the threads between them. */

export type ThreadTheme =
  | "covenant"
  | "sacrifice"
  | "prophecy"
  | "priesthood"
  | "kingship"
  | "exodus"
  | "dwelling"
  | "creation"
  | "nations";

export type ThreadNodeKind = "event" | "person" | "symbol" | "teaching" | "place";

export type ThreadNode = {
  id: string;
  label: string;
  kind: ThreadNodeKind;
  testament: "old" | "new";
  /** Primary Scripture reference, e.g. "Exodus 12". */
  ref: string;
  /** Extra chapter anchors so the reader can surface this node from more than one chapter. */
  alsoIn?: string[];
  summary: string;
  themes: ThreadTheme[];
  /** Matching Atlas entry id, when one exists. */
  entry?: string;
};

export type ThreadEdge = {
  from: string;
  to: string;
  theme: ThreadTheme;
  /** direct — the New Testament names the link. indirect — pattern, echo or shared shape. */
  strength: "direct" | "indirect";
  /** Short phrase for the edge itself, e.g. "lamb without blemish". */
  label: string;
  explanation: string;
  support?: string[];
};

export type Walkthrough = {
  id: string;
  title: string;
  theme: ThreadTheme;
  blurb: string;
  stops: { node: string; note: string }[];
};

export const THEMES: { id: ThreadTheme; label: string; hue: number; blurb: string }[] = [
  { id: "covenant", label: "Covenant", hue: 42, blurb: "Promises God binds himself to keep." },
  { id: "sacrifice", label: "Sacrifice", hue: 25, blurb: "Life given so that others may live." },
  { id: "prophecy", label: "Prophecy", hue: 300, blurb: "Words and signs pointing forward." },
  { id: "priesthood", label: "Priesthood", hue: 95, blurb: "Those who stand between God and people." },
  { id: "kingship", label: "Kingship", hue: 265, blurb: "The promised rule and the throne." },
  { id: "exodus", label: "Exodus", hue: 200, blurb: "Rescue out of slavery, through water, into life." },
  { id: "dwelling", label: "Dwelling", hue: 155, blurb: "God making his home with people." },
  { id: "creation", label: "Creation", hue: 70, blurb: "The first world and the world remade." },
  { id: "nations", label: "Nations", hue: 340, blurb: "Blessing spreading beyond one family." },
];

export const THEME_LABEL = Object.fromEntries(THEMES.map((t) => [t.id, t.label])) as Record<
  ThreadTheme,
  string
>;

/** Colour for a theme. Mid lightness so it reads on both the paper and ink themes. */
export function themeColor(theme: ThreadTheme, opts?: { muted?: boolean }) {
  const hue = THEMES.find((t) => t.id === theme)?.hue ?? 40;
  return opts?.muted ? `oklch(0.62 0.045 ${hue} / 0.28)` : `oklch(0.62 0.135 ${hue})`;
}
