/**
 * Repeat taps must not cost AI credits.
 *
 * Every AI surface is exercised twice with an identical request against a
 * counting fake gateway and an in-memory stand-in for the shared database
 * cache. One gateway call for the first tap, none for the second — including
 * when the server instance recycles and loses its in-memory layer.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/** In-memory stand-in for the shared `atlas_context` table. */
const shared = new Map<string, unknown>();

const claims = new Set<string>();
let claimError = false;

vi.mock("@/integrations/supabase/client.server", () => {
  const table = () => {
    let key = "";
    const builder: Record<string, unknown> = {
      select: () => builder,
      eq: (_col: string, value: string) => {
        key = value;
        return builder;
      },
      maybeSingle: async () => ({
        data: shared.has(key) ? { payload: shared.get(key), status: "active" } : null,
        error: null,
      }),
      upsert: async (row: { cache_key: string; payload: unknown }) => {
        shared.set(row.cache_key, row.payload);
        return { error: null };
      },
    };
    return builder;
  };
  return {
    supabaseAdmin: {
      from: table,
      rpc: async (fn: string, args: { _key?: string } = {}) => {
        if (fn === "claim_ai_cache_key") {
          if (claimError) return { data: null, error: new Error("lock unavailable") };
          const key = args._key ?? "";
          if (claims.has(key)) return { data: false, error: null };
          claims.add(key);
          return { data: true, error: null };
        }
        if (fn === "renew_ai_cache_key") return { data: claims.has(args._key ?? ""), error: null };
        if (fn === "release_ai_cache_key") claims.delete(args._key ?? "");
        return { data: fn === "release_ai_cache_key", error: null };
      },
    },
  };
});

vi.mock("@/lib/monitor.server", () => ({
  measureOps: vi.fn(async (_surface: string, run: () => Promise<unknown>) => run()),
  recordCacheHit: vi.fn(),
  recordOps: vi.fn(),
}));

const gateway = vi.fn();

function jsonReply(content: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: JSON.stringify(content) } }] }),
    text: async () => "",
  };
}

beforeEach(() => {
  shared.clear();
  claims.clear();
  claimError = false;
  gateway.mockReset();
  vi.stubEnv("LOVABLE_API_KEY", "test-key");
  vi.stubGlobal("fetch", gateway);
  vi.resetModules();
});

describe("atlas context", () => {
  const input = { term: "Eden", reference: "Genesis 2:8", verseText: "…a garden eastward in Eden…" };
  const payload = {
    title: "Eden",
    subtitle: "The garden",
    sections: [{ heading: "Place", body: "A garden." }],
    facts: [],
    refs: [],
  };

  it("calls the gateway once for two identical taps", async () => {
    gateway.mockResolvedValue(jsonReply(payload));
    const { generateContext } = await import("@/lib/atlas/ai.server");

    const first = await generateContext(input);
    const second = await generateContext(input);

    expect(gateway).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("serves a recycled server instance from the shared cache", async () => {
    gateway.mockResolvedValue(jsonReply(payload));
    const first = await (await import("@/lib/atlas/ai.server")).generateContext(input);

    vi.resetModules(); // fresh module = empty in-memory layer
    const second = await (await import("@/lib/atlas/ai.server")).generateContext(input);

    expect(gateway).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });
});

describe("artifact purpose", () => {
  const input = {
    artifactTitle: "Denarius",
    term: "denarius",
    reference: "Matthew 20:2",
    verseText: "…agreed with the labourers for a denarius a day…",
  };

  it("calls the gateway once, then answers from cache", async () => {
    gateway.mockResolvedValue(jsonReply({ body: ["A day's wage.", "Hence the bargain."] }));
    const first = await (await import("@/lib/atlas/purpose.server")).generatePurpose(input);

    vi.resetModules();
    const second = await (await import("@/lib/atlas/purpose.server")).generatePurpose(input);

    expect(gateway).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });
});

describe("thread insight", () => {
  const input = {
    label: "Eden",
    reference: "Genesis 2:8",
    summary: "The garden.",
    known: ["Tree of life"],
  };

  it("calls the gateway once, then answers from cache", async () => {
    gateway.mockResolvedValue(
      jsonReply({ paragraphs: ["Eden echoes forward."], links: [{ ref: "Revelation 22:2", note: "Tree" }] }),
    );
    const first = await (await import("@/lib/threads/ai.server")).generateThreadInsight(input);

    vi.resetModules();
    const second = await (await import("@/lib/threads/ai.server")).generateThreadInsight(input);

    expect(gateway).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(first.paragraphs.length).toBeGreaterThan(0);
  });
});

describe("lexicon word", () => {
  const input = {
    word: "heaven",
    reference: "Genesis 1:1",
    verseText: "In the beginning God created the heaven and the earth.",
  };

  it("calls the gateway once, then answers from cache", async () => {
    gateway.mockResolvedValue(
      jsonReply({
        language: "Hebrew",
        original: "שָׁמַיִם",
        transliteration: "shamayim",
        pronunciation: "shah-MAH-yim",
        strongs: "H8064",
        gloss: "the heavens, sky",
        senses: ["sky", "dwelling of God"],
        root: null,
        occurrences: [{ ref: "Psalm 19:1", note: "declare glory" }],
        related: [],
        note: "",
      }),
    );
    const first = await (await import("@/lib/lexicon/lexicon.server")).generateLexeme(input);

    vi.resetModules();
    const second = await (await import("@/lib/lexicon/lexicon.server")).generateLexeme(input);

    expect(gateway).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(first.word).toBe("heaven");
  });
});

describe("pronunciation audio", () => {
  it("calls the speech endpoint once for the same word", async () => {
    gateway.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ audio: "QUJD", mime: "audio/mpeg" }),
      text: async () => "",
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      headers: new Headers({ "content-type": "audio/mpeg" }),
    });

    const first = await (await import("@/lib/lexicon/lexicon.server")).speakWord("shamayim");

    vi.resetModules();
    const second = await (await import("@/lib/lexicon/lexicon.server")).speakWord("Shamayim ");

    expect(gateway).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });
});

describe("concurrent identical requests", () => {
  it("sends one gateway call for ten simultaneous taps", async () => {
    gateway.mockResolvedValue(
      jsonReply({
        title: "Samaria",
        subtitle: "The region",
        sections: [{ heading: "Place", body: "Between Judea and Galilee." }],
        facts: [],
        refs: [],
      }),
    );
    const { generateContext } = await import("@/lib/atlas/ai.server");
    const input = { term: "Samaria", reference: "John 4:4", verseText: "He must needs go…" };

    const results = await Promise.all(Array.from({ length: 10 }, () => generateContext(input)));

    expect(gateway).toHaveBeenCalledTimes(1);
    for (const r of results) expect(r).toEqual(results[0]);
  });

  it("sends one gateway call from two separate server instances", async () => {
    let finish: ((reply: ReturnType<typeof jsonReply>) => void) | undefined;
    gateway.mockImplementation(
      () => new Promise<ReturnType<typeof jsonReply>>((resolve) => {
        finish = resolve;
      }),
    );
    const input = { term: "Bethany", reference: "John 11:1", verseText: "…the town of Mary…" };
    const payload = {
      title: "Bethany",
      subtitle: "The village",
      sections: [{ heading: "Place", body: "Near Jerusalem." }],
      facts: [],
      refs: [],
    };

    const firstModule = await import("@/lib/atlas/ai.server");
    const first = firstModule.generateContext(input);
    await vi.waitFor(() => expect(gateway).toHaveBeenCalledTimes(1));

    vi.resetModules();
    const secondModule = await import("@/lib/atlas/ai.server");
    const second = secondModule.generateContext(input);
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(gateway).toHaveBeenCalledTimes(1);

    if (!finish) throw new Error("Gateway request did not start");
    finish(jsonReply(payload));
    const [a, b] = await Promise.all([first, second]);
    expect(gateway).toHaveBeenCalledTimes(1);
    expect(b).toEqual(a);
  });

  it("does not generate when the distributed lock is unavailable", async () => {
    claimError = true;
    gateway.mockResolvedValue(
      jsonReply({
        title: "Jericho",
        subtitle: "The city",
        sections: [{ heading: "Place", body: "A city." }],
        facts: [],
        refs: [],
      }),
    );
    const { generateContext } = await import("@/lib/atlas/ai.server");

    await expect(
      generateContext({ term: "Jericho", reference: "Joshua 6:1", verseText: "Jericho was shut up…" }),
    ).rejects.toThrow("lock is unavailable");
    expect(gateway).not.toHaveBeenCalled();
  });

  it("keys separately per translation", async () => {
    gateway.mockResolvedValue(
      jsonReply({
        title: "Samaria",
        subtitle: "The region",
        sections: [{ heading: "Place", body: "Between Judea and Galilee." }],
        facts: [],
        refs: [],
      }),
    );
    const { generateContext } = await import("@/lib/atlas/ai.server");
    const base = { term: "Samaria", reference: "John 4:4", verseText: "He must needs go…" };

    await generateContext({ ...base, translation: "kjv" });
    await generateContext({ ...base, translation: "web" });
    await generateContext({ ...base, translation: "kjv" });

    expect(gateway).toHaveBeenCalledTimes(2);
  });
});
