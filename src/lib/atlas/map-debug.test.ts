import { describe, expect, it } from "vitest";
import { isFatalMapError } from "./map-debug";

describe("isFatalMapError", () => {
  it("falls back only on auth and quota errors", () => {
    expect(isFatalMapError(401)).toBe(true);
    expect(isFatalMapError(403)).toBe(true);
    expect(isFatalMapError(429)).toBe(true);
  });
  it("ignores missing tiles, server blips and network errors", () => {
    for (const status of [404, 500, 503, 0, undefined]) expect(isFatalMapError(status)).toBe(false);
  });
});

import { loadTimedOut } from "./map-debug";
describe("loadTimedOut", () => {
  it("keeps waiting while data arrives, gives up on stalls or the hard cap", () => {
    expect(loadTimedOut(15_000, 2_000)).toBe(false);
    expect(loadTimedOut(12_000, 10_000)).toBe(true);
    expect(loadTimedOut(30_000, 0)).toBe(true);
  });
});
