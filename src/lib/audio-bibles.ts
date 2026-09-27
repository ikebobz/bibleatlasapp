/**
 * Which translations have a matching audio Bible, and how much of the canon
 * that audio covers. Anything not listed here simply has no audio.
 */

export type AudioBibleMap = {
  /** API.Bible audio bible id. */
  audioBibleId: string;
  /** "full" = Genesis–Revelation, "nt" = New Testament only. */
  scope: "full" | "nt";
  /** Short description used in tooltips. */
  label: string;
};

export const AUDIO_BIBLES: Record<string, AudioBibleMap> = {
  niv: {
    audioBibleId: "c80b6b4728544ba1-01",
    scope: "full",
    label: "NIV full-Bible narration",
  },
  web: {
    audioBibleId: "105a06b6146d11e7-01",
    scope: "nt",
    label: "WEB dramatized New Testament",
  },
};

export function audioForTranslation(translationId: string | undefined): AudioBibleMap | null {
  if (!translationId) return null;
  return AUDIO_BIBLES[translationId] ?? null;
}

export function hasAudio(translationId: string | undefined): boolean {
  return audioForTranslation(translationId) !== null;
}
