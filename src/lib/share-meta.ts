/**
 * Text fitting helpers for social link previews (iMessage, WhatsApp, X).
 *
 * Platform behaviour we optimise for:
 * - iMessage shows a short title (~2 lines) and a 1-2 line description.
 * - WhatsApp shows ~65 chars of title and ~160-300 chars of description,
 *   and hard-cuts mid-word if the string is longer.
 * So we never hand them a string that they would cut: we fit it ourselves on
 * a word (or sentence) boundary, keeping the reference intact and readable.
 */

export const OG_TITLE_MAX = 60;
export const OG_DESCRIPTION_MAX = 280;

const ELLIPSIS = "…";

/** Collapse whitespace and strip stray markers so text measures predictably. */
export function normalizeVerseText(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1").trim();
}

/** Truncate on a word boundary, never mid-word, appending an ellipsis. */
export function fitOnWordBoundary(text: string, max: number): string {
  const clean = normalizeVerseText(text);
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const cut = slice.lastIndexOf(" ");
  const head = (cut > max * 0.5 ? slice.slice(0, cut) : slice).replace(/[\s,;:.\-—]+$/, "");
  return `${head}${ELLIPSIS}`;
}

/**
 * Title for a shared verse. The reference is always preserved in full; only
 * the site suffix is dropped if the reference alone would push past the cap.
 */
export function verseShareTitle(reference: string, siteName = "Bible Atlas — Read the Bible with Context & Maps"): string {
  const withSuffix = `${reference} — ${siteName}`;
  return withSuffix.length <= OG_TITLE_MAX ? withSuffix : reference;
}

/**
 * Description for a shared verse: the verse text in full when it fits, else
 * fitted on a word boundary. The reference is appended only when there is
 * room, so it can never be the thing that gets clipped.
 */
export function verseShareDescription(text: string, reference: string): string {
  const verse = normalizeVerseText(text);
  const suffix = ` — ${reference}`;
  if (`“${verse}”${suffix}`.length <= OG_DESCRIPTION_MAX) {
    return `“${verse}”${suffix}`;
  }
  const room = OG_DESCRIPTION_MAX - suffix.length - 2; // quotes
  const fitted = fitOnWordBoundary(verse, Math.max(40, room));
  const quoted = `“${fitted}”${suffix}`;
  return quoted.length <= OG_DESCRIPTION_MAX
    ? quoted
    : fitOnWordBoundary(`“${verse}”`, OG_DESCRIPTION_MAX);
}
