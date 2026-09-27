/**
 * On-device chapter store.
 *
 * Every chapter the reader opens is written here, so the same chapter can be
 * read again with no network at all. IndexedDB (not localStorage) because a
 * whole-book download easily exceeds the 5 MB localStorage quota.
 */

import type { Chapter } from "@/lib/bible";
import { DEFAULT_TRANSLATION, type TranslationId } from "@/lib/translations";
import { isChapterComplete } from "@/lib/chapter-complete";

const DB_NAME = "bible-atlas-offline";
const STORE = "chapters";
const META_STORE = "meta";
const DB_VERSION = 2;

export function chapterKey(
  book: string,
  chapter: number,
  translation: TranslationId = DEFAULT_TRANSLATION,
) {
  return `${translation}:${book}:${chapter}`;
}

/** Key used before translations existed; those entries are World English Bible. */
function legacyKey(book: string, chapter: number) {
  return `${book}:${chapter}`;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          // Upgrades keep existing chapters; only missing stores are created.
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
          if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
  storeName: string = STORE,
) {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const request = run(db.transaction(storeName, mode).objectStore(storeName));
          request.onsuccess = () => resolve(request.result as T);
          request.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      }),
  );
}

export async function readStoredChapter(
  book: string,
  chapter: number,
  translation: TranslationId = DEFAULT_TRANSLATION,
): Promise<Chapter | null> {
  // A partial copy (e.g. one-chapter books once saved with only verse 1)
  // counts as missing so it is fetched again when online.
  const ok = (c: Chapter | null | undefined) =>
    c && isChapterComplete(book, chapter, c.verses) ? c : null;
  const value = ok(await tx<Chapter>("readonly", (s) => s.get(chapterKey(book, chapter, translation))));
  if (value) return value;
  if (translation !== DEFAULT_TRANSLATION) return null;
  return ok(await tx<Chapter>("readonly", (s) => s.get(legacyKey(book, chapter))));
}

export async function writeStoredChapter(
  chapter: Chapter,
  translation: TranslationId = DEFAULT_TRANSLATION,
): Promise<void> {
  await tx("readwrite", (s) =>
    s.put(chapter, chapterKey(chapter.book, chapter.chapter, translation)) as IDBRequest<IDBValidKey>,
  );
}

/** Keys of every chapter available offline, e.g. `["web:genesis:1", "kjv:john:3"]`. */
export async function storedChapterKeys(): Promise<string[]> {
  const keys = await tx<IDBValidKey[]>("readonly", (s) => s.getAllKeys());
  // Entries written before translations existed carry a two-part key; treat
  // them as World English Bible so previously saved chapters still count.
  return (keys ?? [])
    .map(String)
    .map((k) => (k.split(":").length === 2 ? `${DEFAULT_TRANSLATION}:${k}` : k));
}

/** How many chapters of one translation are actually on this device. */
export async function countStoredChapters(
  translation: TranslationId = DEFAULT_TRANSLATION,
): Promise<number> {
  const keys = await storedChapterKeys();
  return keys.filter((k) => k.startsWith(`${translation}:`)).length;
}

/** Stored chapter count per translation, e.g. `{ kjv: 1189, web: 42 }`. */
export async function storedChapterCounts(): Promise<Record<string, number>> {
  const keys = await storedChapterKeys();
  const out: Record<string, number> = {};
  for (const k of keys) {
    const id = k.slice(0, k.indexOf(":"));
    out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}

export async function clearStoredChapters(): Promise<void> {
  await tx("readwrite", (s) => s.clear() as IDBRequest<undefined>);
}

/** Write many chapters of one translation in a single transaction. */
export async function writeStoredChapters(
  chapters: Chapter[],
  translation: TranslationId = DEFAULT_TRANSLATION,
): Promise<void> {
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const t = db.transaction(STORE, "readwrite");
      const store = t.objectStore(STORE);
      for (const c of chapters) store.put(c, chapterKey(c.book, c.chapter, translation));
      t.oncomplete = () => resolve();
      t.onerror = () => resolve();
      t.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/** Every stored chapter of one translation, in canonical key order. */
export async function readAllStoredChapters(
  translation: TranslationId = DEFAULT_TRANSLATION,
): Promise<Chapter[]> {
  const db = await openDb();
  if (!db) return [];
  return new Promise<Chapter[]>((resolve) => {
    const out: Chapter[] = [];
    try {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return resolve(out);
        const key = String(cursor.key);
        const prefix = key.split(":").length === 2 ? DEFAULT_TRANSLATION : key.split(":")[0];
        if (prefix === translation) out.push(cursor.value as Chapter);
        cursor.continue();
      };
      request.onerror = () => resolve(out);
    } catch {
      resolve(out);
    }
  });
}

/** Remove every chapter stored for one translation. */
export async function deleteStoredTranslation(translation: TranslationId): Promise<void> {
  const db = await openDb();
  if (!db) return;
  const keys = (await tx<IDBValidKey[]>("readonly", (s) => s.getAllKeys())) ?? [];
  const mine = keys.map(String).filter((k) => {
    const prefix = k.split(":").length === 2 ? DEFAULT_TRANSLATION : k.split(":")[0];
    return prefix === translation;
  });
  await new Promise<void>((resolve) => {
    try {
      const t = db.transaction(STORE, "readwrite");
      const store = t.objectStore(STORE);
      for (const k of mine) store.delete(k);
      t.oncomplete = () => resolve();
      t.onerror = () => resolve();
      t.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Small key/value store for download bookkeeping                              */
/* -------------------------------------------------------------------------- */

export async function readMeta<T>(key: string): Promise<T | null> {
  return (await tx<T>("readonly", (s) => s.get(key), META_STORE)) ?? null;
}

export async function writeMeta<T>(key: string, value: T): Promise<void> {
  await tx("readwrite", (s) => s.put(value, key) as IDBRequest<IDBValidKey>, META_STORE);
}

export async function deleteMeta(key: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(key) as IDBRequest<undefined>, META_STORE);
}
