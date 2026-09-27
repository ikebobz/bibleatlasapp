import { aiCacheKey } from "@/lib/ai/keys";
/**
 * Browser-side persistent cache for generated lexicon entries, so tapping the
 * same word in the same verse is instant and word-for-word identical.
 */

import type { Lexeme } from "./types";

const STORAGE_KEY = "atlas.lexicon.v1";
const MAX_ENTRIES = 400;

type Store = Record<string, { at: number; value: Lexeme }>;

export function lexemeKey(input: { reference: string; word: string; translation?: string }) {
  return aiCacheKey({
    feature: "lexicon",
    entity: input.word,
    reference: input.reference,
    translation: input.translation,
  });
}

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  if (typeof window === "undefined") return;
  try {
    const keys = Object.keys(store);
    if (keys.length > MAX_ENTRIES) {
      keys
        .sort((a, b) => (store[a]?.at ?? 0) - (store[b]?.at ?? 0))
        .slice(0, keys.length - MAX_ENTRIES)
        .forEach((k) => delete store[k]);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota or private mode — cache is best effort */
  }
}

export function readCachedLexeme(key: string): Lexeme | undefined {
  const hit = readStore()[key];
  return hit?.value?.word ? hit.value : undefined;
}

export function writeCachedLexeme(key: string, value: Lexeme) {
  if (!value?.word) return;
  const store = readStore();
  store[key] = { at: Date.now(), value };
  writeStore(store);
}
