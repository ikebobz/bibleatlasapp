import { describe, expect, it } from "vitest";

import { CANONICAL_URL, checkDomain } from "../../scripts/check-domain";

describe("build-time domain guard", () => {
  it("finds no non-canonical public URL anywhere in the project", () => {
    const problems = checkDomain();
    expect(problems.map((p) => `${p.file} — ${p.detail}`)).toEqual([]);
  });

  it("targets the production domain", () => {
    expect(CANONICAL_URL).toBe("https://mybibleatlas.com");
  });
});
