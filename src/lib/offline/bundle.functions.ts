import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEFAULT_TRANSLATION, TRANSLATION_IDS } from "@/lib/translations";

/** Bulk chapter export for the on-device Bible, in any supported translation. */
export const getKjvBundle = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        books: z.array(z.string().max(32)).min(1).max(5),
        translation: z.enum(TRANSLATION_IDS).default(DEFAULT_TRANSLATION),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { loadBooksBundle } = await import("./bundle.server");
    return loadBooksBundle(data.books, data.translation);
  });
