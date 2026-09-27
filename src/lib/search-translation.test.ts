import { afterEach, describe, expect, it, vi } from "vitest";
import { searchSourceFor, supportsSearch, getTranslation } from "./translations";

describe("searchSourceFor", () => {
  it("routes bolls-indexed translations to their index code", () => {
    expect(searchSourceFor("kjv")).toEqual({ kind: "bolls", code: "KJV" });
    expect(searchSourceFor("web")).toEqual({ kind: "bolls", code: "WEB" });
    expect(searchSourceFor("cuv")).toEqual({ kind: "bolls", code: "CUV" });
  });

  it("routes licensed translations to API.Bible", () => {
    expect(searchSourceFor("niv")).toEqual({
      kind: "apibible",
      bibleId: getTranslation("niv").apiBibleId,
    });
    expect(searchSourceFor("yoruba").kind).toBe("apibible");
    expect(searchSourceFor("igbo").kind).toBe("apibible");
  });

  it("routes dynamic catalogue ids to API.Bible", () => {
    const id = "apibible:0123456789abcdef-01";
    expect(searchSourceFor(id)).toEqual({ kind: "apibible", bibleId: "0123456789abcdef-01" });
  });

  it("reports translations with no index as unsupported", () => {
    for (const id of ["darby", "bbe", "almeida"]) {
      expect(searchSourceFor(id)).toEqual({ kind: "none" });
      expect(supportsSearch(id)).toBe(false);
    }
  });

  it("never falls back to another translation's text", () => {
    expect(searchSourceFor("darby")).not.toEqual(searchSourceFor("kjv"));
  });
});

describe("searchBible", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns supported:false without calling the network for unsearchable texts", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const { searchBible } = await import("./search.server");
    const res = await searchBible("love", "darby");
    expect(res).toEqual({ translation: "darby", supported: false, hits: [] });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("queries the bolls index of the selected translation", async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(JSON.stringify({ results: [{ book: 1, chapter: 1, verse: 1, text: "In the <i>beginning</i>" }] }), {
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const { searchBible } = await import("./search.server");
    const res = await searchBible("beginning", "asv");
    // The rate limiter talks to our own database first, so find the upstream
    // search call rather than assuming it is the first request made.
    const urls = (fetchSpy.mock.calls as unknown[][]).map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/find/ASV?"))).toBe(true);
    expect(res.supported).toBe(true);
    expect(res.hits[0]).toMatchObject({ book: "genesis", reference: "Genesis 1:1", text: "In the beginning" });
  });
});
