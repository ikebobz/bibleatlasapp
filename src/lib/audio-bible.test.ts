import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAudioChapter, parseChapterNumber } from "./audio-bible.server";

vi.stubEnv("API_BIBLE_KEY", "test-api-key");

describe("parseChapterNumber", () => {
  it("accepts positive integers", () => {
    expect(parseChapterNumber(3)).toBe(3);
    expect(parseChapterNumber(1)).toBe(1);
  });

  it("rejects zero, negative and non-integers", () => {
    expect(parseChapterNumber(0)).toBeNull();
    expect(parseChapterNumber(-1)).toBeNull();
    expect(parseChapterNumber(3.5)).toBeNull();
  });

  it("parses numeric strings", () => {
    expect(parseChapterNumber("3")).toBe(3);
    expect(parseChapterNumber("001")).toBe(1);
  });

  it("rejects invalid strings", () => {
    expect(parseChapterNumber("abc")).toBeNull();
    expect(parseChapterNumber("")).toBeNull();
  });
});

describe("getAudioChapter", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("maps john:3 to JHN.3 and returns upstream data", async () => {
    const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "JHN.3" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await getAudioChapter({ bookSlug: "john", chapterNumber: 3 });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual({ data: { id: "JHN.3" } });
    expect(mock).toHaveBeenCalledWith(
      "https://api.scripture.api.bible/v1/audio-bibles/105a06b6146d11e7-01/chapters/JHN.3",
      { headers: { "api-key": "test-api-key", accept: "application/json" } },
    );
  });

  it("returns 400 for missing bookSlug", async () => {
    const result = await getAudioChapter({ bookSlug: "", chapterNumber: 1 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  it("returns 400 for invalid chapterNumber", async () => {
    const result = await getAudioChapter({ bookSlug: "john", chapterNumber: "abc" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
  });

  it("returns 404 for unknown book slug", async () => {
    const result = await getAudioChapter({ bookSlug: "unknown", chapterNumber: 1 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
  });

  it("returns upstream status and body on API error", async () => {
    const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
    mock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await getAudioChapter({ bookSlug: "john", chapterNumber: 999 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(404);
    expect(result.detail).toBe(JSON.stringify({ message: "Not found" }));
  });

  it("returns 500 when API key is missing", async () => {
    vi.stubEnv("API_BIBLE_KEY", "");
    const result = await getAudioChapter({ bookSlug: "john", chapterNumber: 3 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(500);
    vi.stubEnv("API_BIBLE_KEY", "test-api-key");
  });
});

import { audioLinkLifeMs, AUDIO_EXPIRY_MARGIN_MS } from "./audio-bible.server";
describe("audioLinkLifeMs", () => {
  const now = 1_790_000_000_000;
  const res = (expiresAt: unknown) => ({ ok: true as const, data: { data: { expiresAt } } });
  it("treats an expired link as stale", () => {
    expect(audioLinkLifeMs(res(String(now / 1000 - 60)), now)).toBeLessThan(0);
  });
  it("follows the link's own expiry minus a margin", () => {
    expect(audioLinkLifeMs(res(String(now / 1000 + 3600)), now)).toBe(3_600_000 - AUDIO_EXPIRY_MARGIN_MS);
  });
  it("never caches failures", () => {
    expect(audioLinkLifeMs({ ok: false, error: "x", status: 500 }, now)).toBe(0);
  });
});
