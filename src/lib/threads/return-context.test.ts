import { describe, expect, it } from "vitest";

import { connectionReturn } from "./return-context";

describe("Connections reader return context", () => {
  it("preserves an English chapter and verse", () => {
    expect(connectionReturn("john/3/16")).toMatchObject({
      label: "John 3:16",
      href: "/john/3/16",
    });
  });

  it("preserves a language-prefixed reader address", () => {
    expect(connectionReturn("fr/john/3")).toMatchObject({
      label: "John 3",
      href: "/fr/john/3",
      lang: "fr",
    });
    expect(connectionReturn("zh/john/3")).toMatchObject({ href: "/zh/john/3", lang: "zh" });
  });

  it("rejects external, non-reader, and invalid paths", () => {
    expect(connectionReturn("https://example.com/john/3")).toBeNull();
    expect(connectionReturn("people/abraham")).toBeNull();
    expect(connectionReturn("john/99")).toBeNull();
  });
});