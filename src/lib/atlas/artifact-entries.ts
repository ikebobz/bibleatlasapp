import { ARTIFACTS } from "./artifacts";
import type { AtlasEntry } from "./types";

/** Interactive objects rendered as full Atlas entries with a 3D model. */
export const ARTIFACT_ENTRIES: AtlasEntry[] = ARTIFACTS.map((a) => ({
  id: a.id,
  title: a.title,
  kind: "object" as const,
  subtitle: a.subtitle,
  matches: a.matches,
  blocks: [
    { type: "prose", heading: "What you are looking at", body: a.intro },
    {
      type: "model3d",
      heading: "3D model",
      caption: "An illustrative reconstruction from the biblical description — proportions, not portraiture.",
      artifactId: a.id,
    },
    { type: "facts", heading: "Measurements", items: a.measurements },
    { type: "facts", heading: "Materials", items: a.materials },
    {
      type: "steps",
      heading: "Construction",
      caption: "How it was made, in the order it came together.",
      items: a.construction.map((c) => ({ title: c.title, body: c.body })),
    },
    { type: "prose", heading: "Purpose in the verses", body: a.purpose },
    { type: "refs", heading: "Where it appears", items: a.refs },
  ],
}));
