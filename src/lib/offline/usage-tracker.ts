/**
 * Lightweight, anonymous usage signals used to decide when the offline-Bible
 * prompt is worth showing. Everything stays in localStorage on the device.
 */

const KEY = "bible-atlas:usage";

export type Usage = {
  chapters: number;
  /** Whole minutes of reading time. */
  minutes: number;
  /** ISO dates (yyyy-mm-dd) the app was opened on, most recent last. */
  days: string[];
  /** Session start timestamp, used so the first session never prompts. */
  sessionStart: number;
};

const EMPTY: Usage = { chapters: 0, minutes: 0, days: [], sessionStart: 0 };

export function readUsage(): Usage {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Usage>;
    return {
      chapters: Number(parsed.chapters ?? 0),
      minutes: Number(parsed.minutes ?? 0),
      days: Array.isArray(parsed.days) ? parsed.days.slice(-10) : [],
      sessionStart: Number(parsed.sessionStart ?? 0),
    };
  } catch {
    return EMPTY;
  }
}

function write(usage: Usage) {
  try {
    localStorage.setItem(KEY, JSON.stringify(usage));
  } catch {
    /* storage full or blocked — usage tracking is best-effort */
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Call once per app load. */
export function noteSession() {
  const usage = readUsage();
  const day = today();
  if (usage.days[usage.days.length - 1] !== day) usage.days = [...usage.days, day].slice(-10);
  usage.sessionStart = Date.now();
  write(usage);
}

export function noteChapterRead() {
  const usage = readUsage();
  usage.chapters += 1;
  write(usage);
}

export function noteReadingMinutes(minutes: number) {
  if (minutes <= 0) return;
  const usage = readUsage();
  usage.minutes += minutes;
  write(usage);
}

/**
 * Meaningful use: 3+ chapters, 10+ minutes, or the app opened on 2 different
 * days. The very first session never qualifies.
 */
export function hasMeaningfulUsage(): boolean {
  const usage = readUsage();
  return usage.days.length >= 2 || usage.chapters >= 3 || usage.minutes >= 10;
}
