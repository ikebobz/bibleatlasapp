import { aiCacheKey } from "@/lib/ai/keys";
/**
 * Browser-side cache for generated pronunciation audio. Audio is large, so the
 * store is deliberately small and skips anything oversized; a miss simply means
 * the word is spoken by the server (or the browser voice) once more.
 */

const STORAGE_KEY = "atlas.speech.v1";
const MAX_ENTRIES = 40;
const MAX_BYTES = 200_000; // per clip, base64 characters

type Store = Record<string, { at: number; uri: string }>;

export function speechKey(text: string) {
  return aiCacheKey({ feature: "audio", entity: text });
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
    /* quota or private mode — audio cache is best effort */
  }
}

export function readCachedSpeech(key: string): string | undefined {
  const hit = readStore()[key];
  return hit?.uri || undefined;
}

export function writeCachedSpeech(key: string, uri: string) {
  if (!uri || uri.length > MAX_BYTES) return;
  const store = readStore();
  store[key] = { at: Date.now(), uri };
  writeStore(store);
}
