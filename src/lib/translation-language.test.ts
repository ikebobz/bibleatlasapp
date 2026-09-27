import { describe, expect, it } from "vitest";
import {
  deepLinkTranslation,
  defaultTranslationForLanguage,
  deviceTranslation,
  getTranslation,
  languageCodeFor,
} from "./translations";

describe("defaultTranslationForLanguage", () => {
  it("resolves ISO codes case-insensitively", () => {
    expect(defaultTranslationForLanguage("yo")).toBe("yoruba");
    expect(defaultTranslationForLanguage("YO")).toBe("yoruba");
    expect(defaultTranslationForLanguage(" yo ")).toBe("yoruba");
    expect(defaultTranslationForLanguage("ig")).toBe("igbo");
    expect(defaultTranslationForLanguage("de")).toBe("lut");
    expect(defaultTranslationForLanguage("fr")).toBe("segond");
  });

  it("resolves language names case-insensitively", () => {
    expect(defaultTranslationForLanguage("english")).toBe("kjv");
    expect(defaultTranslationForLanguage("Yorùbá")).toBe("yoruba");
  });

  it("returns the first registry translation per language", () => {
    // Registry order is the picker order; English's default is KJV.
    expect(defaultTranslationForLanguage("en")).toBe("kjv");
  });

  it("ignores unknown or empty codes", () => {
    expect(defaultTranslationForLanguage("xx")).toBeUndefined();
    expect(defaultTranslationForLanguage("")).toBeUndefined();
    expect(defaultTranslationForLanguage("   ")).toBeUndefined();
    expect(defaultTranslationForLanguage(undefined)).toBeUndefined();
  });
});

describe("deepLinkTranslation", () => {
  it("prefers an exact translation id over a language alias", () => {
    expect(deepLinkTranslation("web", "yo")).toBe("web");
  });

  it("falls back to the language alias", () => {
    expect(deepLinkTranslation(undefined, "yo")).toBe("yoruba");
  });

  it("is undefined when neither resolves", () => {
    expect(deepLinkTranslation(undefined, "xx")).toBeUndefined();
    expect(deepLinkTranslation(undefined, undefined)).toBeUndefined();
  });
});

describe("languageCodeFor", () => {
  it("maps translations to ISO codes", () => {
    expect(languageCodeFor("yoruba")).toBe("yo");
    expect(languageCodeFor("kjv")).toBe("en");
    expect(languageCodeFor("rv1909")).toBe("es");
    expect(languageCodeFor(undefined)).toBeUndefined();
  });
});

describe("Reina-Valera 1909 registry entry", () => {
  it("is a real Spanish translation backed by getbible", () => {
    const rv = getTranslation("rv1909");
    expect(rv.id).toBe("rv1909");
    expect(rv.language).toBe("Español");
    expect(rv.getbibleCode).toBe("valera");
    expect(rv.displayOnly).toBeFalsy();
  });

  it("resolves ?lang=es and the language name", () => {
    expect(defaultTranslationForLanguage("es")).toBe("rv1909");
    expect(defaultTranslationForLanguage("español")).toBe("rv1909");
  });
});

describe("deviceTranslation", () => {
  it("prefers the device's first matching locale, base codes only", () => {
    expect(deviceTranslation(["es-ES", "es", "en"])).toBe("rv1909");
    expect(deviceTranslation(["es_MX"])).toBe("rv1909");
    expect(deviceTranslation(["yo-NG"])).toBe("yoruba");
    expect(deviceTranslation(["de-DE", "en-US"])).toBe("lut");
  });

  it("skips unknown locales and falls through the preference list", () => {
    expect(deviceTranslation(["ja-JP", "fr-FR"])).toBe("segond");
    expect(deviceTranslation(["ja-JP"])).toBeUndefined();
    expect(deviceTranslation([])).toBeUndefined();
    expect(deviceTranslation(undefined)).toBeUndefined();
  });
});
