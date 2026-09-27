/**
 * Browser-side persistent cache for generated context panels.
 *
 * Tapping the same word in the same verse again is served from localStorage,
 * so no AI request (and no credit) is spent a second time on that device.
 */

import { aiCacheKey } from "@/lib/ai/keys";

export type CachedContextPanel = {
  title: string;
  subtitle: string;
  blocks: unknown[];
  generated: true;
};

const STORAGE_KEY = "atlas.context.v1";
const MAX_ENTRIES = 400;

type Store = Record<string, { at: number; value: CachedContextPanel }>;

export function contextKey(input: { term: string; reference: string; translation?: string }) {
  return aiCacheKey({
    feature: "context",
    entity: input.term,
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

export function readCachedContextPanel(key: string): CachedContextPanel | undefined {
  const hit = readStore()[key];
  return hit?.value?.blocks?.length ? hit.value : undefined;
}

export function writeCachedContextPanel(key: string, value: CachedContextPanel) {
  if (!value?.blocks?.length) return;
  const store = readStore();
  store[key] = { at: Date.now(), value };
  writeStore(store);
}
