/**
 * Public-domain translations the reader can switch between.
 *
 * Every entry here is either public domain or explicitly free to redistribute:
 * no modern copyrighted translation (NIV, ESV, RVR1960 …) is included, and no
 * text is scraped — chapters come from the same two open Bible APIs the reader
 * already uses (bible-api.com and bolls.life).
 */

export type KnownTranslationId =
  | "kjv"
  | "web"
  | "asv"
  | "bsb"
  | "niv"
  
  | "msg"
  | "ylt"
  | "darby"

  | "bbe"
  | "dra"
  | "lut"
  | "segond"
  | "almeida"
  | "statenvertaling"
  | "synod"
  | "cuv"
  | "yoruba"
  | "igbo"
  | "rv1909"
  | "vulgate";

/**
 * A translation id is either one of our built-in texts or a dynamic
 * `apibible:<bibleId>` id discovered from the API.Bible catalogue at runtime.
 */
export type TranslationId = KnownTranslationId | `apibible:${string}`;

export type Translation = {
  id: TranslationId;
  /** Short badge shown in the header. */
  label: string;
  /** Full display name used in captions and screen-reader text. */
  name: string;
  /** Language group in the picker. */
  language: string;
  /** bible-api.com translation code, when that source carries the text. */
  apiCode?: string;
  /** bolls.life index code, used for chapters and full-text search. */
  searchCode?: string;
  /** getbible.net v2 code, for public-domain texts the other sources lack. */
  getbibleCode?: string;
  /** API.Bible id for licensed texts; requires the API_BIBLE_KEY secret. */
  apiBibleId?: string;
  /** Copyright line the licence requires us to display with the text. */
  copyright?: string;
  /** Open licence the text is published under, when there is one. */
  licence?: { name: string; url: string };
  /**
   * All-rights-reserved texts that may be displayed online but never stored,
   * cached or redistributed. Openly licensed texts (CC BY-SA) are not
   * display-only even though they carry a copyright notice.
   */
  displayOnly?: boolean;
  blurb: string;
};



export const TRANSLATIONS: Translation[] = [
  {
    id: "kjv",
    label: "KJV",
    name: "King James Version",
    language: "English",
    apiCode: "kjv",
    searchCode: "KJV",
    blurb: "Classic 1769 text, public domain",
  },
  {
    id: "web",
    label: "WEB",
    name: "World English Bible",
    language: "English",
    apiCode: "web",
    searchCode: "WEB",
    blurb: "Modern English, public domain",
  },
  {
    id: "asv",
    label: "ASV",
    name: "American Standard Version",
    language: "English",
    apiCode: "asv",
    searchCode: "ASV",
    blurb: "1901 American revision, public domain",
  },
  {
    id: "bsb",
    label: "BSB",
    name: "Berean Standard Bible",
    language: "English",
    searchCode: "BSB",
    blurb: "Modern English, released to the public domain",
  },
  {
    id: "niv",
    label: "NIV",
    name: "New International Version (2011)",
    language: "English",
    apiBibleId: "78a9f6124f344018-01",
    copyright:
      "The Holy Bible, New International Version® NIV® Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.® Used by permission. All rights reserved worldwide.",
    displayOnly: true,
    blurb: "Modern English, licensed via API.Bible",
  },
  {

    id: "msg",
    label: "MSG",
    name: "The Message",
    language: "English",
    apiBibleId: "6f11a7de016f942e-01",
    copyright:
      "THE MESSAGE: The Bible in Contemporary Language copyright © 1993, 2002, 2018 by Eugene H. Peterson. All rights reserved. Used by permission of NavPress. Represented by Tyndale House Publishers.",
    displayOnly: true,
    blurb: "Contemporary paraphrase, licensed via API.Bible",
  },


  {
    id: "ylt",
    label: "YLT",
    name: "Young's Literal Translation",
    language: "English",

    apiCode: "ylt",
    searchCode: "YLT",
    blurb: "1898 word-for-word rendering",
  },
  {
    id: "darby",
    label: "DBY",
    name: "Darby Translation",
    language: "English",
    apiCode: "darby",
    getbibleCode: "darby",
    blurb: "1890 literal translation",
  },
  {
    id: "bbe",
    label: "BBE",
    name: "Bible in Basic English",
    language: "English",
    apiCode: "bbe",
    blurb: "Simple 1,000-word vocabulary",
  },
  {
    id: "dra",
    label: "DRA",
    name: "Douay-Rheims American Edition",
    language: "English",
    apiCode: "dra",
    searchCode: "DRB",
    blurb: "Catholic translation from the Vulgate",
  },
  {
    id: "lut",
    label: "LUT",
    name: "Luther Bibel (1912)",
    language: "Deutsch",
    searchCode: "LUT",
    blurb: "German, public domain",
  },
  {
    id: "segond",
    label: "LSG",
    name: "Louis Segond (1910)",
    language: "Français",
    searchCode: "FRLSG",
    blurb: "French, public domain",
  },
  {
    id: "almeida",
    label: "ALM",
    name: "João Ferreira de Almeida",
    language: "Português",
    apiCode: "almeida",
    getbibleCode: "almeida",
    blurb: "Portuguese, public domain",
  },
  {
    id: "rv1909",
    label: "RV1909",
    name: "Reina-Valera 1909",
    language: "Español",
    getbibleCode: "valera",
    blurb: "Spanish, public domain",
  },
  {
    id: "statenvertaling",
    label: "SV",
    name: "Statenvertaling (1637)",
    language: "Nederlands",
    searchCode: "DSV",
    blurb: "Dutch, public domain",
  },
  {
    id: "synod",
    label: "СИН",
    name: "Синодальный перевод",
    language: "Русский",
    searchCode: "SYNOD",
    blurb: "Russian Synodal, public domain",
  },
  {
    id: "cuv",
    label: "和合本",
    name: "Chinese Union Version",
    language: "中文",
    searchCode: "CUV",
    blurb: "Traditional Chinese, public domain",
  },
  {
    id: "yoruba",
    label: "BMYO",
    name: "Biblica® Open Yoruba Contemporary Bible",
    language: "Yorùbá",
    apiBibleId: "b8d1feac6e94bd74-01",
    copyright:
      "Biblica® ní oore ọ̀fẹ́ láti lo Bíbélì Mímọ́ ní Èdè Yorùbá Òde-Òní™ / Biblica® Open Yoruba Contemporary Bible™ Copyright © 2009, 2017 by Biblica, Inc. “Biblica” is a trademark registered in the United States Patent and Trademark Office by Biblica, Inc. Used with permission.",
    licence: { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
    blurb: "Yoruba, openly licensed by Biblica (CC BY-SA 4.0)",
  },
  {
    id: "igbo",
    label: "BIUO",
    name: "Biblica® Open Igbo Contemporary Bible",
    language: "Igbo",
    apiBibleId: "a36fc06b086699f1-02",
    copyright:
      "Biblica® Baịbụlụ Nsọ nʼIgbo Ndị Ugbu a nke dịrị onye ọbụla ịgụ / Biblica® Open Igbo Contemporary Bible™ Copyright © 1980, 1988, 2019, 2020 by Biblica, Inc. Used with permission. All rights reserved worldwide.",
    licence: { name: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
    blurb: "Igbo, openly licensed by Biblica (CC BY-SA 4.0)",
  },
  {

    id: "vulgate",
    label: "VUL",
    name: "Vulgata Clementina",
    language: "Latina",
    searchCode: "VULG",
    blurb: "Latin, public domain",
  },
];

/** Every valid translation id, for input validation. */
export const TRANSLATION_IDS = TRANSLATIONS.map((t) => t.id) as [
  KnownTranslationId,
  ...KnownTranslationId[],
];

/** Shape of an id that came from the API.Bible catalogue. */
export const DYNAMIC_TRANSLATION_RE = /^apibible:[0-9a-f]{16}-\d{2}$/;

export function isDynamicTranslationId(id: string): id is `apibible:${string}` {
  return DYNAMIC_TRANSLATION_RE.test(id);
}

/**
 * Translations discovered from the API.Bible catalogue. Populated on the
 * client once the catalogue route responds; the server resolves ids straight
 * from the id itself, so nothing depends on this being filled in.
 */
const dynamicRegistry = new Map<string, Translation>();

/**
 * Notable texts our API.Bible key authorises. The catalogue returns hundreds
 * of editions with terse abbreviations, so these get a proper name, badge and
 * blurb, and are floated to the top of their language group. They stay dynamic
 * `apibible:` ids — nothing about fetching, caching or the display-only guards
 * changes; this only affects how they read in the picker.
 */
const CURATED_CATALOGUE: Record<
  string,
  { label: string; name: string; blurb: string; rank: number }
> = {
  "a81b73293d3080c9-01": {
    label: "AMP",
    name: "Amplified Bible",
    blurb: "Expanded wording for study, licensed via API.Bible",
    rank: 1,
  },
  "d6e14a625393b4da-01": {
    label: "NLT",
    name: "New Living Translation",
    blurb: "Clear contemporary English, licensed via API.Bible",
    rank: 2,
  },
  "555fef9a6cb31151-01": {
    label: "CEV",
    name: "Contemporary English Version",
    blurb: "Plain, easy-reading English, licensed via API.Bible",
    rank: 3,
  },
  "61fd76eafa1577c2-01": {
    label: "GNT",
    name: "Good News Translation",
    blurb: "Everyday English, licensed via API.Bible",
    rank: 4,
  },
  "65eec8e0b60e656b-01": {
    label: "FBV",
    name: "Free Bible Version",
    blurb: "Modern English from the Greek and Hebrew",
    rank: 5,
  },
  "01b29f4b342acc35-01": {
    label: "LSV",
    name: "Literal Standard Version",
    blurb: "Highly literal modern English",
    rank: 6,
  },
  "c315fa9f71d4af3a-01": {
    label: "GNV",
    name: "Geneva Bible (1599)",
    blurb: "The Reformation study Bible",
    rank: 7,
  },
  "40072c4a5aba4022-01": {
    label: "RV",
    name: "Revised Version (1885)",
    blurb: "The first official revision of the KJV",
    rank: 8,
  },
};

/** Sort weight for a translation in the picker: curated texts come first. */
export function cataloguePriority(t: Translation): number {
  const curated = t.apiBibleId ? CURATED_CATALOGUE[t.apiBibleId] : undefined;
  return curated ? curated.rank : 100;
}

export function dynamicTranslation(row: {
  id: string;
  label: string;
  name: string;
  language: string;
  apiBibleId: string;
  copyright?: string;
}): Translation {
  const curated = CURATED_CATALOGUE[row.apiBibleId];
  return {
    id: row.id as TranslationId,
    label: curated?.label ?? row.label,
    name: curated?.name ?? row.name,
    language: row.language,
    apiBibleId: row.apiBibleId,
    ...(row.copyright ? { copyright: row.copyright } : {}),
    // Catalogue texts are licensed for online display only.
    displayOnly: true,
    blurb: curated?.blurb ?? `${row.language}, licensed via API.Bible`,
  };
}


export function registerDynamicTranslations(rows: Translation[]) {
  for (const row of rows) dynamicRegistry.set(row.id, row);
}

/** Fallback used when an `apibible:` id has not been registered locally. */
function synthesiseDynamic(id: string): Translation {
  const bibleId = id.slice("apibible:".length);
  return {
    id: id as TranslationId,
    label: bibleId.slice(0, 4).toUpperCase(),
    name: "API.Bible text",
    language: "Other",
    apiBibleId: bibleId,
    displayOnly: true,
    blurb: "Licensed via API.Bible",
  };
}

/**
 * The default text is public domain on purpose: it can be cached durably,
 * stored offline and served to crawlers without spending a licensed API
 * request. NIV and the other licensed texts are one tap away in the picker and
 * are remembered once a reader chooses them.
 */
export const DEFAULT_TRANSLATION: KnownTranslationId = "kjv";

export function getTranslation(id: string | undefined): Translation {
  if (id && isDynamicTranslationId(id)) {
    return dynamicRegistry.get(id) ?? synthesiseDynamic(id);
  }
  return (
    TRANSLATIONS.find((t) => t.id === id) ??
    TRANSLATIONS.find((t) => t.id === DEFAULT_TRANSLATION) ??
    TRANSLATIONS[0]!
  );
}

export function isTranslationId(value: unknown): value is TranslationId {
  return (
    typeof value === "string" &&
    (TRANSLATIONS.some((t) => t.id === value) || isDynamicTranslationId(value))
  );
}

/** ISO 639 code for each picker language group (registry languages are display names). */
const LANGUAGE_ISO: Record<string, string> = {
  English: "en",
  Deutsch: "de",
  Français: "fr",
  Português: "pt",
  Nederlands: "nl",
  Русский: "ru",
  中文: "zh",
  Yorùbá: "yo",
  Igbo: "ig",
  Español: "es",
  Latina: "la",
};

/** ISO code for a translation's language, when the language has one. */
export function languageCodeFor(id: TranslationId | string | undefined): string | undefined {
  if (!id) return undefined;
  return LANGUAGE_ISO[getTranslation(id).language];
}

/**
 * The default translation for a language deep link (`?lang=yo`). Accepts an
 * ISO code ("yo", "EN") or a language name ("yorùbá"), case-insensitively, and
 * returns the first registry translation in that language — the same ordering
 * the picker shows. Unknown codes resolve to undefined and are ignored.
 */
export function defaultTranslationForLanguage(code: string | undefined): TranslationId | undefined {
  const needle = code?.trim().toLowerCase();
  if (!needle) return undefined;
  return TRANSLATIONS.find(
    (t) => LANGUAGE_ISO[t.language] === needle || t.language.toLowerCase() === needle,
  )?.id;
}

/**
 * Resolution for deep links carrying a version: an exact translation id
 * (`?t=`) always wins over a language alias (`?lang=`).
 */
export function deepLinkTranslation(
  t: TranslationId | undefined,
  lang: string | undefined,
): TranslationId | undefined {
  return t ?? defaultTranslationForLanguage(lang);
}

/**
 * First-run language detection: walk the device's preferred locales
 * (`navigator.languages`, base codes only — "es-ES" → "es") and return the
 * first language we actually have a Bible for. Undefined when nothing matches,
 * so the caller falls back to the default translation.
 */
export function deviceTranslation(
  locales: readonly string[] | undefined,
): TranslationId | undefined {
  for (const locale of locales ?? []) {
    const base = locale.trim().toLowerCase().split(/[-_]/)[0];
    const match = defaultTranslationForLanguage(base);
    if (match) return match;
  }
  return undefined;
}

/**
 * Translations grouped by language: built-ins first in registry order, then
 * catalogue texts with the curated ones (AMP, NLT, CEV …) ahead of the rest.
 */
export function translationsByLanguage(
  extra: Translation[] = [],
): { language: string; items: Translation[] }[] {
  const ranked = [...extra].sort(
    (a, b) => cataloguePriority(a) - cataloguePriority(b) || a.name.localeCompare(b.name),
  );
  const groups: { language: string; items: Translation[] }[] = [];
  for (const t of [...TRANSLATIONS, ...ranked]) {
    const group = groups.find((g) => g.language === t.language);
    if (group) group.items.push(t);
    else groups.push({ language: t.language, items: [t] });
  }
  return groups;
}


/**
 * Where full-text search runs for a translation.
 *
 * Derived from the translation registry itself, so every version — including
 * ids discovered from the API.Bible catalogue at runtime — is routed without
 * any per-component mapping. Texts with neither source are reported as
 * unsupported rather than silently searching a different translation.
 */
export type SearchSource =
  | { kind: "bolls"; code: string }
  | { kind: "apibible"; bibleId: string }
  | { kind: "none" };

export function searchSourceFor(id: TranslationId | string | undefined): SearchSource {
  const t = getTranslation(id);
  if (t.searchCode) return { kind: "bolls", code: t.searchCode };
  if (t.apiBibleId) return { kind: "apibible", bibleId: t.apiBibleId };
  return { kind: "none" };
}

/** Whether the reader can run a text search in this translation at all. */
export function supportsSearch(id: TranslationId | string | undefined): boolean {
  return searchSourceFor(id).kind !== "none";
}


/**
 * All-rights-reserved texts (NIV, NKJV, MSG) may be displayed online but not
 * stored on a device, so they are never written to the offline store. Openly
 * licensed texts such as the Biblica CC BY-SA Yoruba and Igbo Bibles carry a
 * copyright notice but *may* be cached and downloaded.
 */
export function isLicensedTranslation(id: string | undefined): boolean {
  return Boolean(getTranslation(id).displayOnly);
}

/** Translation ids that must never be persisted offline. */
export const LICENSED_TRANSLATION_IDS = TRANSLATIONS.filter((t) => t.displayOnly).map((t) => t.id);

