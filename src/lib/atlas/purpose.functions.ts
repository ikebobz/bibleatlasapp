import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generatePurpose } from "./purpose.server";

export const getArtifactPurpose = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        artifactTitle: z.string().min(1).max(100),
        term: z.string().min(1).max(100),
        reference: z.string().min(1).max(120),
        verseText: z.string().min(1).max(2000),
        translation: z.string().max(16).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    (await import("@/lib/origin-guard.server")).requireSameOrigin();
    const { enforceAiQuota } = await import("@/lib/ratelimit.server");
    await enforceAiQuota("purpose");
    return generatePurpose(data);
  });
