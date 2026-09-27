/**
 * Language addresses for the reader: `/yo/genesis/1`, `/fr/john/3/16`.
 *
 * English keeps today's unprefixed addresses and doubles as x-default. Each
 * other language maps to the one openly licensed / public-domain version that
 * the language address always serves.
 */

import type { TranslationId } from "@/lib/translations";
import { SITE_URL } from "@/lib/site";

export const LANG_ROUTES = {
  yo: "yoruba",
  ig: "igbo",
  fr: "segond",
  de: "lut",
  pt: "almeida",
  es: "rv1909",
  zh: "cuv",
  nl: "statenvertaling",
  ru: "synod",
} as const satisfies Record<string, TranslationId>;

export type LangCode = keyof typeof LANG_ROUTES;
export const LANG_CODES = Object.keys(LANG_ROUTES) as LangCode[];

export function isLangCode(value: unknown): value is LangCode {
  return typeof value === "string" && value in LANG_ROUTES;
}

/** Language address code for a translation, when it has one. */
export function langForTranslation(id: string | undefined): LangCode | undefined {
  if (!id) return undefined;
  return LANG_CODES.find((c) => LANG_ROUTES[c] === id);
}

/** Prefix a reader path ("/genesis/1") with a language code, or leave it English. */
export function langPath(lang: LangCode | undefined, path: string): string {
  return lang ? `/${lang}${path}` : path;
}

/** Language code at the start of a pathname, if any. */
export function langFromPathname(pathname: string): LangCode | undefined {
  const first = pathname.split("/")[1];
  return isLangCode(first) ? first : undefined;
}

/** BCP-47 tag for `<html lang>` and hreflang. */
export function htmlLang(lang: LangCode | undefined): string {
  if (!lang) return "en";
  return lang === "zh" ? "zh-Hant" : lang;
}

/** hreflang alternates for a reader path, English as x-default. */
export function readerAlternates(path: string) {
  return [
    { rel: "alternate", hrefLang: "en", href: `${SITE_URL}${path}` },
    ...LANG_CODES.map((c) => ({
      rel: "alternate",
      hrefLang: htmlLang(c),
      href: `${SITE_URL}/${c}${path}`,
    })),
    { rel: "alternate", hrefLang: "x-default", href: `${SITE_URL}${path}` },
  ];
}
