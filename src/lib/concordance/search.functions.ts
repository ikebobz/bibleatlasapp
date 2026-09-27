import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { searchConcordance, suggestTerms, trendingTerms } from "./search.server";

export const concordanceSearch = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        query: z.string().min(2).max(60),
        testament: z.enum(["old", "new"]).nullish(),
        book: z.string().max(32).nullish(),
        page: z.number().int().min(1).max(400).default(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { logSearch } = await import("./search.server");
    const result = await searchConcordance({
      query: data.query,
      testament: data.testament ?? null,
      book: data.book ?? null,
      page: data.page,
    });
    if (data.page === 1 && !data.book && !data.testament) void logSearch(data.query);
    return result;
  });

export const concordanceSuggest = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ prefix: z.string().min(1).max(40) }).parse(data))
  .handler(async ({ data }) => suggestTerms(data.prefix));

export const concordanceTrending = createServerFn({ method: "GET" }).handler(async () =>
  trendingTerms(),
);
