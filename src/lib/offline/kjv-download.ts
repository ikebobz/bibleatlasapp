/**
 * Whole-Bible download manager, per translation.
 *
 * Books are pulled from our own backend a few at a time (the KJV straight from
 * the database, other translations from the open Bible sources), written into
 * the existing IndexedDB chapter store, and the progress state is persisted
 * after every batch so closing the app mid-download resumes rather than
 * restarts. Every translation keeps its own independent state.
 */

import { BOOKS } from "@/lib/bible";
import { trackNav } from "@/lib/analytics/nav-events";
import { DEFAULT_TRANSLATION, type TranslationId } from "@/lib/translations";
import { getKjvBundle } from "./bundle.functions";
import {
  countStoredChapters,
  deleteMeta,
  deleteStoredTranslation,
  readMeta,
  writeMeta,
  writeStoredChapters,
} from "./chapter-store";

const metaKey = (translation: TranslationId) =>
  translation === "kjv" ? "kjv-download" : `download:${translation}`;
const BATCH = 3;
const TOTAL_CHAPTERS = BOOKS.reduce((n, b) => n + b.chapters, 0);

export type DownloadPhase = "idle" | "downloading" | "paused" | "complete" | "error";

export type KjvDownloadState = {
  phase: DownloadPhase;
  /** Book ids already stored. */
  done: string[];
  chapters: number;
  bytes: number;
  verses: number;
  verified: boolean;
  updatedAt: number;
  /** Estimated seconds remaining while downloading. */
  eta: number | null;
  error: string | null;
};

const INITIAL: KjvDownloadState = {
  phase: "idle",
  done: [],
  chapters: 0,
  bytes: 0,
  verses: 0,
  verified: false,
  updatedAt: 0,
  eta: null,
  error: null,
};

type Persisted = Omit<KjvDownloadState, "eta" | "error">;

type Slot = {
  state: KjvDownloadState;
  hydrated: boolean;
  running: boolean;
  pauseRequested: boolean;
};

const slots = new Map<TranslationId, Slot>();
const listeners = new Set<() => void>();

function slot(translation: TranslationId): Slot {
  let s = slots.get(translation);
  if (!s) {
    s = { state: INITIAL, hydrated: false, running: false, pauseRequested: false };
    slots.set(translation, s);
  }
  return s;
}

function emit() {
  for (const l of listeners) l();
}

function set(translation: TranslationId, patch: Partial<KjvDownloadState>) {
  const s = slot(translation);
  s.state = { ...s.state, ...patch };
  emit();
}

async function persist(translation: TranslationId) {
  const { eta: _eta, error: _error, ...rest } = slot(translation).state;
  await writeMeta<Persisted>(metaKey(translation), { ...rest, updatedAt: Date.now() });
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(translation: TranslationId = DEFAULT_TRANSLATION): KjvDownloadState {
  return slot(translation).state;
}

export function getServerSnapshot(): KjvDownloadState {
  return INITIAL;
}

/** True when any translation — not just the KJV — is mid-download. */
export function anyDownloading(): boolean {
  for (const s of slots.values()) {
    if (s.state.phase === "downloading") return true;
  }
  return false;
}

export async function hydrate(translation: TranslationId = DEFAULT_TRANSLATION) {
  const s = slot(translation);
  if (s.hydrated) return s.state;
  s.hydrated = true;
  const saved = await readMeta<Persisted>(metaKey(translation));
  if (saved) {
    set(translation, {
      ...saved,
      // A download interrupted by a reload comes back paused, ready to resume.
      phase: saved.phase === "downloading" ? "paused" : saved.phase,
      eta: null,
      error: null,
    });
    // Bookkeeping can outlive the text itself (browser storage eviction, a
    // cleared site). Never claim a version is downloaded unless its chapters
    // are really there.
    if (slot(translation).state.phase === "complete") {
      const stored = await countStoredChapters(translation);
      if (stored < TOTAL_CHAPTERS) {
        set(translation, { phase: "paused", verified: false, chapters: stored });
        await persist(translation);
      }
    }
  }
  return slot(translation).state;
}

/** Storage status of one translation, for the settings list. */
export type DownloadSummary = {
  translation: TranslationId;
  phase: DownloadPhase;
  chapters: number;
  total: number;
  bytes: number;
};

export async function downloadSummary(translation: TranslationId): Promise<DownloadSummary> {
  const state = await hydrate(translation);
  const chapters = await countStoredChapters(translation);
  const phase: DownloadPhase =
    state.phase === "downloading"
      ? "downloading"
      : chapters >= TOTAL_CHAPTERS
        ? "complete"
        : chapters > 0
          ? "paused"
          : "idle";
  return { translation, phase, chapters, total: TOTAL_CHAPTERS, bytes: state.bytes };
}

export const TOTAL_KJV_CHAPTERS = TOTAL_CHAPTERS;

/** Rough download size, refined by real bytes once the first batch lands. */
export function estimateBytes(s: KjvDownloadState) {
  if (s.chapters > 0 && s.bytes > 0) return Math.round((s.bytes / s.chapters) * TOTAL_CHAPTERS);
  return 4_600_000;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function pauseDownload(translation: TranslationId = DEFAULT_TRANSLATION) {
  const s = slot(translation);
  if (s.state.phase !== "downloading") return;
  s.pauseRequested = true;
  set(translation, { phase: "paused", eta: null });
}

export async function deleteKjv(translation: TranslationId = DEFAULT_TRANSLATION) {
  const s = slot(translation);
  s.pauseRequested = true;
  await deleteStoredTranslation(translation);
  await deleteMeta(metaKey(translation));
  s.state = { ...INITIAL };
  emit();
  if (translation === "kjv") trackNav("kjv_deleted");
}

export async function startDownload(translation: TranslationId = DEFAULT_TRANSLATION) {
  await hydrate(translation);
  const s = slot(translation);
  if (s.running) return;
  s.running = true;
  s.pauseRequested = false;
  const resuming = s.state.done.length > 0;
  set(translation, { phase: "downloading", error: null });
  if (!resuming && translation === "kjv") trackNav("kjv_download_started");

  const startedAt = Date.now();
  const startChapters = s.state.chapters;

  try {
    const remaining = BOOKS.filter((b) => !s.state.done.includes(b.id)).map((b) => b.id);

    for (let i = 0; i < remaining.length; i += BATCH) {
      if (s.pauseRequested) break;
      const batch = remaining.slice(i, i + BATCH);

      let bundles: Awaited<ReturnType<typeof getKjvBundle>> | null = null;
      for (let attempt = 0; attempt < 3 && !bundles; attempt += 1) {
        try {
          bundles = await getKjvBundle({ data: { books: batch, translation } });
        } catch (error) {
          if (attempt === 2) throw error;
          await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        }
      }
      if (!bundles) break;

      for (const bundle of bundles) {
        if (!bundle.chapters.length) continue;
        await writeStoredChapters(bundle.chapters, translation);
        set(translation, {
          done: [...s.state.done, bundle.book],
          chapters: s.state.chapters + bundle.chapters.length,
          verses: s.state.verses + bundle.verses,
          bytes: s.state.bytes + JSON.stringify(bundle.chapters).length,
        });
      }

      const elapsed = (Date.now() - startedAt) / 1000;
      const gained = s.state.chapters - startChapters;
      const rate = gained > 0 ? gained / elapsed : 0;
      set(translation, {
        eta: rate > 0 ? Math.round((TOTAL_CHAPTERS - s.state.chapters) / rate) : null,
      });
      await persist(translation);
    }

    if (s.pauseRequested) {
      set(translation, { phase: "paused", eta: null });
    } else {
      // "Complete" means the chapters are verifiably in storage, not merely
      // that every book was fetched.
      const stored = await countStoredChapters(translation);
      const complete =
        s.state.done.length === BOOKS.length &&
        s.state.chapters >= TOTAL_CHAPTERS &&
        stored >= TOTAL_CHAPTERS;
      set(translation, {
        phase: complete ? "complete" : "paused",
        verified: complete,
        eta: null,
      });
      if (complete && translation === "kjv") trackNav("kjv_download_completed");
    }
    await persist(translation);
  } catch (error) {
    set(translation, {
      phase: "error",
      eta: null,
      error: error instanceof Error ? error.message : "Download failed",
    });
    await persist(translation);
    if (translation === "kjv") trackNav("kjv_download_failed");
  } finally {
    s.running = false;
    s.pauseRequested = false;
  }
}
