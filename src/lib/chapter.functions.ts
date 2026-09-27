import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadChapter } from "./chapter.server";
import {
  DEFAULT_TRANSLATION,
  DYNAMIC_TRANSLATION_RE,
  TRANSLATION_IDS,
  type TranslationId,
} from "./translations";

export const getChapter = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        book: z.string(),
        chapter: z.number().int().min(1),
        translation: z
          .union([z.enum(TRANSLATION_IDS), z.string().regex(DYNAMIC_TRANSLATION_RE)])
          .default(DEFAULT_TRANSLATION),
      })
      .parse(data),
  )
  .handler(async ({ data }) => loadChapter(data.book, data.chapter, data.translation as TranslationId));
