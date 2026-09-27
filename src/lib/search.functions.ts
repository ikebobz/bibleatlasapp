import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { searchBible } from "./search.server";
import {
  DEFAULT_TRANSLATION,
  DYNAMIC_TRANSLATION_RE,
  TRANSLATION_IDS,
  type TranslationId,
} from "./translations";

export const searchScripture = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        query: z.string().min(2).max(120),
        translation: z
          .union([z.enum(TRANSLATION_IDS), z.string().regex(DYNAMIC_TRANSLATION_RE)])
          .default(DEFAULT_TRANSLATION),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { logSearchEvent } = await import("./search.server");
    try {
      const result = await searchBible(data.query, data.translation as TranslationId);
      void logSearchEvent({
        query: data.query,
        translation: data.translation,
        results: result.hits.length,
        outcome: result.supported ? "ok" : "unsupported",
      });
      return result;
    } catch (err) {
      void logSearchEvent({
        query: data.query,
        translation: data.translation,
        results: 0,
        outcome: "error",
      });
      throw err;
    }
  });
