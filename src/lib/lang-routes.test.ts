import { describe, expect, it } from "vitest";
import { BOOKS } from "@/lib/bible";
import { LANG_CODES, langForTranslation, langFromPathname, readerAlternates } from "@/lib/lang-routes";
import { entriesForSection } from "@/lib/sitemap";
import { verseUrl, verseLanguageUrl } from "@/lib/share";

describe("language addresses", () => {
  it("never clash with a book slug", () => {
    for (const c of LANG_CODES) expect(BOOKS.some((b) => b.id === c)).toBe(false);
  });
  it("reads the language from a path", () => {
    expect(langFromPathname("/yo/genesis/1")).toBe("yo");
    expect(langFromPathname("/genesis/1")).toBeUndefined();
  });
  it("builds a reciprocal hreflang set with x-default", () => {
    const alts = readerAlternates("/john/3");
    expect(alts).toHaveLength(LANG_CODES.length + 2);
    expect(alts.find((a) => a.hrefLang === "x-default")?.href).toBe("https://mybibleatlas.com/john/3");
    expect(alts.find((a) => a.hrefLang === "yo")?.href).toBe("https://mybibleatlas.com/yo/john/3");
  });
  it("shares language verses by address", () => {
    const o = { origin: "https://mybibleatlas.com" };
    expect(verseLanguageUrl("john", 3, 16, "yo", o)).toBe("https://mybibleatlas.com/yo/john/3/16?s=share");
    expect(verseUrl("john", 3, 16, { translation: "segond", ...o })).toBe(
      "https://mybibleatlas.com/fr/john/3/16?s=share",
    );
    expect(langForTranslation("kjv")).toBeUndefined();
  });
  it("lists language chapters in the sitemap", () => {
    expect(entriesForSection("yo-chapters-1")?.[0].path).toBe("/yo/genesis/1");
    expect(entriesForSection("xx-chapters-1")).toBeNull();
  });
});
