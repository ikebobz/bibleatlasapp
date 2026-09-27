import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateThreadInsight } from "./ai.server";

export const getThreadInsight = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        label: z.string().min(1).max(100),
        reference: z.string().min(1).max(120),
        summary: z.string().min(1).max(2000),
        known: z.array(z.string().max(120)).max(20).default([]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    (await import("@/lib/origin-guard.server")).requireSameOrigin();
    const { enforceAiQuota } = await import("@/lib/ratelimit.server");
    await enforceAiQuota("thread");
    return generateThreadInsight(data);
  });
