/**
 * Deterministic cache keys for every shared AI answer.
 *
 * The same contextual question must produce the same key on every device and
 * every server isolate — that is what lets one reader's generated answer serve
 * everybody else. The key carries everything that materially changes the
 * answer: the feature, the entity, the passage, the translation, the language
 * and the prompt version.
 *
 * Bump the prompt version below whenever a prompt or response shape changes;
 * old entries stay in place (and stay auditable) while new ones are generated.
 */

export type AiFeature = "context" | "purpose" | "lexicon" | "thread" | "audio";

export const PROMPT_VERSION: Record<AiFeature, number> = {
  context: 2,
  purpose: 2,
  lexicon: 2,
  thread: 2,
  audio: 1,
};

/** Answers that change with the wording of the verse the reader is looking at. */
export const TRANSLATION_SENSITIVE: Record<AiFeature, boolean> = {
  context: true,
  purpose: true,
  lexicon: true,
  thread: false,
  audio: false,
};

function norm(value: string | undefined | null) {
  return (value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function aiCacheKey(input: {
  feature: AiFeature;
  entity: string;
  reference?: string;
  translation?: string;
  language?: string;
}): string {
  const version = PROMPT_VERSION[input.feature];
  const translation = TRANSLATION_SENSITIVE[input.feature] ? norm(input.translation) || "kjv" : "-";
  return [
    "ai",
    input.feature,
    norm(input.entity),
    norm(input.reference),
    translation,
    norm(input.language) || "en",
    `v${version}`,
  ].join(":");
}
