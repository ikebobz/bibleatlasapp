import { getBook } from "@/lib/bible";
import { htmlLang, isLangCode, type LangCode } from "@/lib/lang-routes";

export type ConnectionReturn = {
  label: string;
  href: string;
  lang?: LangCode;
};

/** Parse a narrow internal reader path. External and non-reader paths are rejected. */
export function connectionReturn(from: string | undefined): ConnectionReturn | null {
  if (!from) return null;
  const clean = from.split(/[?#]/, 1)[0]?.replace(/^\/+|\/+$/g, "") ?? "";
  const parts = clean.split("/").filter(Boolean);
  const maybeLang = parts[0];
  const lang = isLangCode(maybeLang) ? maybeLang : undefined;
  const offset = lang ? 1 : 0;
  if (parts.length < offset + 2 || parts.length > offset + 3) return null;
  const book = getBook(parts[offset]);
  const chapter = Number(parts[offset + 1]);
  const verse = parts[offset + 2] ? Number(parts[offset + 2]) : undefined;
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return null;
  if (verse !== undefined && (!Number.isInteger(verse) || verse < 1)) return null;
  const suffix = `${book.id}/${chapter}${verse ? `/${verse}` : ""}`;
  return {
    label: `${book.name} ${chapter}${verse ? `:${verse}` : ""}`,
    href: `/${lang ? `${htmlLang(lang) === "zh-Hant" ? "zh" : lang}/` : ""}${suffix}`,
    lang,
  };
}