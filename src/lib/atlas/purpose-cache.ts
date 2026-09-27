import { aiCacheKey } from "@/lib/ai/keys";
/**
 * Browser-side persistent cache for generated artifact purpose notes.
 *
 * The server keeps an in-memory cache, but that is lost whenever the serverless
 * instance recycles. Persisting per-verse results locally means clicking the
 * same coin/artifact in the same verse again is instant and word-for-word
 * identical, even across reloads.
 */

export type CachedPurpose = { heading: string; body: string[] };

const STORAGE_KEY = "atlas.purpose.v1";
const MAX_ENTRIES = 300;

type Store = Record<string, { at: number; value: CachedPurpose }>;

export function purposeKey(input: {
  entryId: string;
  reference: string;
  term: string;
  translation?: string;
}) {
  return aiCacheKey({
    feature: "purpose",
    entity: `${input.entryId}|${input.term}`,
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
      // drop the oldest entries
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

export function readCachedPurpose(key: string): CachedPurpose | undefined {
  const hit = readStore()[key];
  if (!hit?.value?.body?.length) return undefined;
  return hit.value;
}

export function writeCachedPurpose(key: string, value: CachedPurpose) {
  if (!value?.body?.length) return;
  const store = readStore();
  store[key] = { at: Date.now(), value };
  writeStore(store);
}
