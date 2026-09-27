import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateLexeme, speakWord } from "./lexicon.server";

export const getLexeme = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        word: z.string().min(1).max(60),
        reference: z.string().min(1).max(80),
        verseText: z.string().min(1).max(2000),
        translation: z.string().max(16).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    (await import("@/lib/origin-guard.server")).requireSameOrigin();
    const { enforceAiQuota } = await import("@/lib/ratelimit.server");
    await enforceAiQuota("lexeme");
    return generateLexeme(data);
  });

export const getPronunciationAudio = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ text: z.string().trim().min(1).max(40) }).parse(data))
  .handler(async ({ data }) => {
    (await import("@/lib/origin-guard.server")).requireSameOrigin();
    const { enforceAiQuota } = await import("@/lib/ratelimit.server");
    await enforceAiQuota("speech");
    return speakWord(data.text);
  });
