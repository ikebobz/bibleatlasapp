import { describe, expect, it } from "vitest";

import { ATLAS_ENTRIES } from "./entries";
import { ATLAS_INDEX } from "./entry-index.generated";

/**
 * The reader ships the small generated index instead of the full entry
 * content. This guards against the two drifting apart — regenerate with
 * `bun run scripts/gen-atlas-index.ts` if it fails.
 */
describe("atlas entry index", () => {
  it("covers every entry with the same match metadata", () => {
    expect(ATLAS_INDEX.length).toBe(ATLAS_ENTRIES.length);
    const byId = new Map(ATLAS_INDEX.map((e) => [e.id, e]));
    for (const entry of ATLAS_ENTRIES) {
      const indexed = byId.get(entry.id);
      expect(indexed, `missing index entry for ${entry.id}`).toBeDefined();
      expect(indexed!.title).toBe(entry.title);
      expect(indexed!.kind).toBe(entry.kind);
      expect(indexed!.subtitle).toBe(entry.subtitle);
      expect(indexed!.matches).toEqual(entry.matches);
      expect(indexed!.scope ?? undefined).toEqual(entry.scope ?? undefined);
    }
  });
});
