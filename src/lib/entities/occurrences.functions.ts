import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Verses mentioning a person or place, from the indexed KJV concordance. */
export const entityOccurrences = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        query: z.string().min(2).max(60),
        page: z.number().int().min(1).max(200).default(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { searchConcordance } = await import("@/lib/concordance/search.server");
    return searchConcordance({ query: data.query, page: data.page });
  });
