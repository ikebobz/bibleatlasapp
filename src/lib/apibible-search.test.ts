import { afterEach, describe, expect, it, vi } from "vitest";

const RESPONSE = {
  data: {
    verses: [
      { bookId: "GEN", chapterId: "GEN.40", reference: "Gẹnẹsisi 40:11", text: "Ife Farao sì wà" },
      { bookId: "JHN", chapterId: "JHN.3", reference: "John 3:16", text: "For God so <b>loved</b>" },
      { bookId: "ENO", chapterId: "ENO.1", reference: "Enoch 1:1", text: "outside our canon" },
      { bookId: "GEN", chapterId: "GEN.99", reference: "Genesis 99:1", text: "out of range" },
    ],
  },
};

describe("searchApiBible", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps USFM ids back to reader book ids and drops rows outside our canon", async () => {
    process.env["API_BIBLE_KEY"] = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(RESPONSE), { headers: { "content-type": "application/json" } })),
    );
    const { searchApiBible } = await import("./apibible.server");
    const hits = await searchApiBible("love", "78a9f6124f344018-01");
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({ book: "genesis", chapter: 40, verse: 11 });
    expect(hits[1]).toMatchObject({ book: "john", chapter: 3, verse: 16, text: "For God so loved" });
  });
});
