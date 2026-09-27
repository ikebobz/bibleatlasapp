/** Atlas content model: typed blocks composed into a contextual panel. */

export type EntityKind =
  | "person"
  | "place"
  | "people"
  | "journey"
  | "event"
  | "object"
  | "covenant"
  | "prophecy"
  | "miracle"
  | "concept";

export type Scope = { book: string; chapter?: number };

export type CrossRef = { ref: string; note: string };

export type TimelineItem = {
  label: string;
  when?: string;
  detail: string;
  ref?: string;
  accent?: boolean;
};

export type TreeNode = {
  name: string;
  role?: string;
  entry?: string;
  children?: TreeNode[];
};

export type RouteStop = {
  place: string;
  label?: string;
  note?: string;
};

export type Block =
  | { type: "prose"; heading: string; body: string[] }
  | { type: "facts"; heading: string; items: { label: string; value: string }[] }
  | {
      type: "map";
      heading: string;
      caption?: string;
      focus?: string[];
      route?: { name: string; stops: RouteStop[] };
      compare?: { name: string; stops: RouteStop[]; muted?: boolean }[];
    }
  | { type: "timeline"; heading: string; caption?: string; items: TimelineItem[] }
  | { type: "tree"; heading: string; caption?: string; root: TreeNode }
  | { type: "refs"; heading: string; items: CrossRef[] }
  | {
      type: "diagram";
      heading: string;
      caption?: string;
      columns: { title: string; subtitle?: string; items: string[] }[];
    }
  | { type: "steps"; heading: string; caption?: string; items: { title: string; body: string }[] }
  | { type: "connections"; heading: string; caption?: string; nodeId: string }
  | { type: "model3d"; heading: string; caption?: string; artifactId: string };

export type AtlasEntry = {
  id: string;
  title: string;
  kind: EntityKind;
  subtitle: string;
  /** Phrases in the biblical text that open this entry. */
  matches: string[];
  /** Limit matching to these books/chapters. Omit for anywhere. */
  scope?: Scope[];
  blocks: Block[];
};
