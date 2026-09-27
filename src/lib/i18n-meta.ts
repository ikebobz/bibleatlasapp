/** Short localized title/description templates for language reader pages. */

import type { LangCode } from "@/lib/lang-routes";

type Templates = {
  locale: string;
  chapter: (ref: string) => string;
  chapterDesc: (ref: string) => string;
  book: (name: string, n: number) => string;
  bookDesc: (name: string, n: number) => string;
};

export const LANG_META: Record<LangCode, Templates> = {
  yo: {
    locale: "yo_NG",
    chapter: (r) => `${r} — Bibeli Mimọ | Bible Atlas`,
    chapterDesc: (r) => `Ka ${r} ní èdè Yorùbá pẹ̀lú àwọn máàpù àti àlàyé lẹ́gbẹ̀ẹ́ ẹsẹ kọ̀ọ̀kan.`,
    book: (n, c) => `${n} — orí ${c} | Bible Atlas`,
    bookDesc: (n, c) => `Ka gbogbo orí ${c} ti ${n} ní èdè Yorùbá lórí Bible Atlas.`,
  },
  ig: {
    locale: "ig_NG",
    chapter: (r) => `${r} — Baịbụl Nsọ | Bible Atlas`,
    chapterDesc: (r) => `Gụọ ${r} n'asụsụ Igbo, ya na maapụ na nkọwa n'akụkụ amaokwu ọ bụla.`,
    book: (n, c) => `${n} — isi ${c} | Bible Atlas`,
    bookDesc: (n, c) => `Gụọ isi ${c} niile nke ${n} n'asụsụ Igbo na Bible Atlas.`,
  },
  fr: {
    locale: "fr_FR",
    chapter: (r) => `${r} — lire le chapitre | Bible Atlas`,
    chapterDesc: (r) => `Lisez ${r} (Louis Segond) avec cartes, chronologies et contexte à côté de chaque verset.`,
    book: (n, c) => `${n} — les ${c} chapitres | Bible Atlas`,
    bookDesc: (n, c) => `Lisez les ${c} chapitres de ${n} (Louis Segond) avec cartes et contexte.`,
  },
  de: {
    locale: "de_DE",
    chapter: (r) => `${r} — Kapitel lesen | Bible Atlas`,
    chapterDesc: (r) => `Lesen Sie ${r} (Luther) mit Karten, Zeitleisten und Kontext neben jedem Vers.`,
    book: (n, c) => `${n} — alle ${c} Kapitel | Bible Atlas`,
    bookDesc: (n, c) => `Lesen Sie alle ${c} Kapitel von ${n} (Luther) mit Karten und Kontext.`,
  },
  pt: {
    locale: "pt_BR",
    chapter: (r) => `${r} — ler o capítulo | Bible Atlas`,
    chapterDesc: (r) => `Leia ${r} (Almeida) com mapas, linhas do tempo e contexto ao lado de cada versículo.`,
    book: (n, c) => `${n} — todos os ${c} capítulos | Bible Atlas`,
    bookDesc: (n, c) => `Leia os ${c} capítulos de ${n} (Almeida) com mapas e contexto.`,
  },
  es: {
    locale: "es_ES",
    chapter: (r) => `${r} — leer el capítulo | Bible Atlas`,
    chapterDesc: (r) => `Lee ${r} (Reina-Valera 1909) con mapas, líneas de tiempo y contexto junto a cada versículo.`,
    book: (n, c) => `${n} — los ${c} capítulos | Bible Atlas`,
    bookDesc: (n, c) => `Lee los ${c} capítulos de ${n} (Reina-Valera 1909) con mapas y contexto.`,
  },
  zh: {
    locale: "zh_TW",
    chapter: (r) => `${r} — 閱讀全章 | Bible Atlas`,
    chapterDesc: (r) => `閱讀 ${r}（和合本），每節經文旁附有地圖、年表與背景資料。`,
    book: (n, c) => `${n} — 共 ${c} 章 | Bible Atlas`,
    bookDesc: (n, c) => `閱讀 ${n} 全部 ${c} 章（和合本），附地圖與背景資料。`,
  },
  nl: {
    locale: "nl_NL",
    chapter: (r) => `${r} — hoofdstuk lezen | Bible Atlas`,
    chapterDesc: (r) => `Lees ${r} (Statenvertaling) met kaarten, tijdlijnen en context naast elk vers.`,
    book: (n, c) => `${n} — alle ${c} hoofdstukken | Bible Atlas`,
    bookDesc: (n, c) => `Lees alle ${c} hoofdstukken van ${n} (Statenvertaling) met kaarten en context.`,
  },
  ru: {
    locale: "ru_RU",
    chapter: (r) => `${r} — читать главу | Bible Atlas`,
    chapterDesc: (r) => `Читайте ${r} (Синодальный перевод) с картами, хронологией и контекстом рядом с каждым стихом.`,
    book: (n, c) => `${n} — все ${c} глав | Bible Atlas`,
    bookDesc: (n, c) => `Читайте все ${c} глав книги ${n} (Синодальный перевод) с картами и контекстом.`,
  },
};
