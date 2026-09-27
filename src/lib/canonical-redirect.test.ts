import { describe, expect, it } from "vitest";

import { canonicalHostRedirect, canonicalRedirectTarget } from "./canonical-redirect";

const CANONICAL = "https://mybibleatlas.com";

function redirect(url: string) {
  return canonicalHostRedirect(new Request(url));
}

describe("legacy hosts redirect to the canonical domain", () => {
  it("301s a verse link and keeps every parameter", () => {
    const res = redirect("https://bibleatlas.lovable.app/john/3/16?t=web&s=share");
    expect(res?.status).toBe(301);
    expect(res?.headers.get("location")).toBe(`${CANONICAL}/john/3/16?t=web&s=share`);
  });

  it("301s the www subdomain", () => {
    expect(canonicalRedirectTarget("https://www.mybibleatlas.com/maps/paul?leg=2")).toBe(
      `${CANONICAL}/maps/paul?leg=2`,
    );
  });

  it("preserves chapters, concordance terms, connections and hashes", () => {
    const cases: [string, string][] = [
      ["https://bibleatlas.lovable.app/genesis/1", `${CANONICAL}/genesis/1`],
      ["https://bibleatlas.lovable.app/concordance/faith", `${CANONICAL}/concordance/faith`],
      ["https://bibleatlas.lovable.app/connections/passover?s=share", `${CANONICAL}/connections/passover?s=share`],
      ["https://bibleatlas.lovable.app/genesis/2?v=8#v8", `${CANONICAL}/genesis/2?v=8#v8`],
      ["https://bibleatlas.lovable.app/maps/abraham", `${CANONICAL}/maps/abraham`],
      ["https://bibleatlas.lovable.app/sitemap.xml", `${CANONICAL}/sitemap.xml`],
    ];
    for (const [from, to] of cases) {
      expect(canonicalRedirectTarget(from), from).toBe(to);
    }
  });
});

describe("hosts that must never be redirected", () => {
  it.each([
    `${CANONICAL}/john/3/16`,
    "http://localhost:8080/john/3/16",
    "https://id-preview--2d4512d7.lovable.app/john/3/16",
    "https://project--abc-dev.lovable.app/john/3/16",
    "https://bibleatlas.lovable.app/api/public/health",
    "https://bibleatlas.lovable.app/api/public/push/send-daily",
  ])("serves %s directly", (url) => {
    expect(canonicalRedirectTarget(url)).toBeNull();
    expect(redirect(url)).toBeNull();
  });
});
