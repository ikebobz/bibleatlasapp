import { describe, expect, it } from "vitest";

import { boundedCache } from "./lru";

describe("boundedCache", () => {
  it("stores and returns values", () => {
    const cache = boundedCache<number>(3);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("missing")).toBeUndefined();
  });

  it("never grows beyond its ceiling", () => {
    const cache = boundedCache<number>(3);
    for (let i = 0; i < 50; i++) cache.set(`k${i}`, i);
    expect(cache.size).toBe(3);
    expect(cache.get("k49")).toBe(49);
    expect(cache.get("k0")).toBeUndefined();
  });

  it("keeps recently read entries alive", () => {
    const cache = boundedCache<number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a"); // refresh recency
    cache.set("c", 3);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
  });
});
