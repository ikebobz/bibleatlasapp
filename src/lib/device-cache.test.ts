/**
 * @vitest-environment jsdom
 *
 * Device caches must survive a page refresh: a reload throws away every module
 * and in-memory value, but localStorage stays. Reloading is simulated with
 * `vi.resetModules()` plus a fresh dynamic import.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

async function reload<T>(path: string): Promise<T> {
  vi.resetModules();
  return (await import(/* @vite-ignore */ path)) as T;
}

beforeEach(() => {
  window.localStorage.clear();
  vi.resetModules();
});

describe("atlas context cache", () => {
  const panel = {
    title: "Eden",
    subtitle: "The garden",
    blocks: [{ kind: "prose", body: "A garden eastward." }],
    generated: true as const,
  };

  it("returns the identical panel after a refresh", async () => {
    const mod = await import("@/lib/atlas/context-cache.browser");
    const key = mod.contextKey({ term: "Eden", reference: "Genesis 2:8" });
    mod.writeCachedContextPanel(key, panel);

    const after = await reload<typeof mod>("@/lib/atlas/context-cache.browser");
    expect(after.readCachedContextPanel(key)).toEqual(panel);
  });

  it("is case-insensitive on the tapped word", async () => {
    const { contextKey } = await import("@/lib/atlas/context-cache.browser");
    expect(contextKey({ term: "EDEN", reference: "Genesis 2:8" })).toBe(
      contextKey({ term: "eden", reference: "Genesis 2:8" }),
    );
  });

  it("ignores an empty panel rather than caching a blank result", async () => {
    const mod = await import("@/lib/atlas/context-cache.browser");
    mod.writeCachedContextPanel("k", { ...panel, blocks: [] });
    expect(mod.readCachedContextPanel("k")).toBeUndefined();
  });

  it("falls through quietly when the store is corrupted", async () => {
    window.localStorage.setItem("atlas.context.v1", "{not json");
    const mod = await import("@/lib/atlas/context-cache.browser");
    expect(mod.readCachedContextPanel("k")).toBeUndefined();
    expect(() => mod.writeCachedContextPanel("k", panel)).not.toThrow();
  });
});

describe("lexicon cache", () => {
  const lexeme = {
    word: "heaven",
    language: "Hebrew" as const,
    original: "שָׁמַיִם",
    transliteration: "shamayim",
    pronunciation: "shah-MAH-yim",
    strongs: "H8064",
    gloss: "the heavens",
    senses: ["sky"],
    root: null,
    occurrences: [],
    related: [],
    note: "",
  };

  it("survives a refresh word for word", async () => {
    const mod = await import("@/lib/lexicon/cache");
    const key = mod.lexemeKey({ reference: "Genesis 1:1", word: "Heaven" });
    mod.writeCachedLexeme(key, lexeme);

    const after = await reload<typeof mod>("@/lib/lexicon/cache");
    expect(after.readCachedLexeme(key)).toEqual(lexeme);
  });

  it("evicts the oldest entries first when the cap is exceeded", async () => {
    const mod = await import("@/lib/lexicon/cache");
    for (let i = 0; i < 410; i++) {
      mod.writeCachedLexeme(`k${i}`, { ...lexeme, word: `w${i}` });
    }
    expect(mod.readCachedLexeme("k0")).toBeUndefined();
    expect(mod.readCachedLexeme("k409")?.word).toBe("w409");
  });
});

describe("thread insight cache", () => {
  const insight = {
    paragraphs: ["Eden echoes forward."],
    links: [{ ref: "Revelation 22:2", note: "Tree of life" }],
    generated: true as const,
  };

  it("survives a refresh", async () => {
    const mod = await import("@/lib/threads/insight-cache");
    const key = mod.insightKey("eden");
    mod.writeCachedInsight(key, insight);

    const after = await reload<typeof mod>("@/lib/threads/insight-cache");
    expect(after.readCachedInsight(key)).toEqual(insight);
  });

  it("does not cache an empty insight", async () => {
    const mod = await import("@/lib/threads/insight-cache");
    mod.writeCachedInsight("x", { ...insight, paragraphs: [] });
    expect(mod.readCachedInsight("x")).toBeUndefined();
  });
});

describe("pronunciation audio cache", () => {
  const uri = "data:audio/mpeg;base64,QUJD";

  it("survives a refresh", async () => {
    const mod = await import("@/lib/lexicon/speech-cache");
    const key = mod.speechKey(" Shamayim ");
    mod.writeCachedSpeech(key, uri);

    const after = await reload<typeof mod>("@/lib/lexicon/speech-cache");
    expect(after.readCachedSpeech(mod.speechKey("shamayim"))).toBe(uri);
  });

  it("skips an oversized clip instead of filling the store", async () => {
    const mod = await import("@/lib/lexicon/speech-cache");
    mod.writeCachedSpeech("big", `data:audio/mpeg;base64,${"A".repeat(300_000)}`);
    expect(mod.readCachedSpeech("big")).toBeUndefined();
  });

  it("never throws when storage is unavailable", async () => {
    const mod = await import("@/lib/lexicon/speech-cache");
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => mod.writeCachedSpeech("k", uri)).not.toThrow();
    setItem.mockRestore();
  });
});

describe("artifact purpose cache", () => {
  it("survives a refresh", async () => {
    const mod = await import("@/lib/atlas/purpose-cache");
    const key = mod.purposeKey({ entryId: "denarius", reference: "Matthew 20:2", term: "Denarius" });
    const value = { heading: "Purpose in Matthew 20:2", body: ["A day's wage."] };
    mod.writeCachedPurpose(key, value);

    const after = await reload<typeof mod>("@/lib/atlas/purpose-cache");
    expect(after.readCachedPurpose(key)).toEqual(value);
  });
});
