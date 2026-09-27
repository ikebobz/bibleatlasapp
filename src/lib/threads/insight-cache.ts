import { aiCacheKey } from "@/lib/ai/keys";
/**
 * Browser-side persistent cache for generated thread insights, so re-opening
 * the same connection node costs no AI request on this device.
 */

export type ThreadInsight = {
  paragraphs: string[];
  links: { ref: string; note: string }[];
  generated: true;
};

const STORAGE_KEY = "atlas.threads.v1";
const MAX_ENTRIES = 400;

type Store = Record<string, { at: number; value: ThreadInsight }>;

export function insightKey(nodeId: string) {
  return aiCacheKey({ feature: "thread", entity: nodeId });
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

export function readCachedInsight(key: string): ThreadInsight | undefined {
  const hit = readStore()[key];
  return hit?.value?.paragraphs?.length ? hit.value : undefined;
}

export function writeCachedInsight(key: string, value: ThreadInsight) {
  if (!value?.paragraphs?.length) return;
  const store = readStore();
  store[key] = { at: Date.now(), value };
  writeStore(store);
}
