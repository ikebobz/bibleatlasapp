import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Chapter } from "./bible";

const getChapter = vi.fn();
const readStoredChapter = vi.fn();
const writeStoredChapter = vi.fn();

vi.mock("./chapter.functions", () => ({ getChapter: (...a: unknown[]) => getChapter(...a) }));
vi.mock("./offline/chapter-store", () => ({
  readStoredChapter: (...a: unknown[]) => readStoredChapter(...a),
  writeStoredChapter: (...a: unknown[]) => writeStoredChapter(...a),
}));

const { chapterErrorReason, loadChapterOffline } = await import("./chapter-query");

const chapter = (book: string, n: number): Chapter =>
  ({ book, chapter: n, verses: [{ number: 1, text: "In the beginning" }] }) as Chapter;

function setOnline(online: boolean) {
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: online },
    configurable: true,
  });
}

describe("chapter loading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOnline(true);
  });

  it("serves a downloaded chapter without touching the network", async () => {
    readStoredChapter.mockResolvedValue(chapter("genesis", 2));
    const result = await loadChapterOffline("genesis", 2, "kjv");
    expect(result.chapter).toBe(2);
    expect(getChapter).not.toHaveBeenCalled();
  });

  it("fetches and stores a chapter that is not on the device", async () => {
    readStoredChapter.mockResolvedValue(null);
    getChapter.mockResolvedValue(chapter("john", 3));
    const result = await loadChapterOffline("john", 3, "kjv");
    expect(result.chapter).toBe(3);
    expect(writeStoredChapter).toHaveBeenCalledWith(result, "kjv");
  });

  it("never reads or writes storage for a licensed version", async () => {
    getChapter.mockResolvedValue(chapter("john", 3));
    await loadChapterOffline("john", 3, "niv");
    expect(readStoredChapter).not.toHaveBeenCalled();
    expect(writeStoredChapter).not.toHaveBeenCalled();
  });

  it("reports a missing download when offline", async () => {
    setOnline(false);
    readStoredChapter.mockResolvedValue(null);
    getChapter.mockRejectedValue(new Error("network down"));
    const error = await loadChapterOffline("exodus", 1, "kjv").catch((e: unknown) => e);
    expect(chapterErrorReason(error)).toBe("not-downloaded");
  });

  it("reports a network problem when the device is online", async () => {
    readStoredChapter.mockResolvedValue(null);
    getChapter.mockRejectedValue(new Error("500"));
    const error = await loadChapterOffline("exodus", 1, "kjv").catch((e: unknown) => e);
    expect(chapterErrorReason(error)).toBe("network");
  });
});
