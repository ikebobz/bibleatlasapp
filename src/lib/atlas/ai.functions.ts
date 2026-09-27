import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateContext } from "./ai.server";

export const getAiContext = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        term: z.string().min(1).max(100),
        reference: z.string().min(1).max(120),
        verseText: z.string().min(1).max(2000),
        translation: z.string().max(64).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { enforceAiQuota } = await import("@/lib/ratelimit.server");
    await enforceAiQuota("context");
    return generateContext(data);
  });
