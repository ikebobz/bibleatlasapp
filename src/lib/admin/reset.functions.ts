/**
 * Passcode-reset endpoints for the admin area.
 *
 * These are the only unauthenticated admin endpoints, so each one is
 * rate-limited and answers with as little information as possible: the
 * request step never reveals whether an address matched, and the token steps
 * never distinguish "wrong", "expired" and "already used".
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const REQUEST_LIMIT = 5; // reset emails per hour, per visitor
const REQUEST_WINDOW = 60 * 60;
const COMPLETE_LIMIT = 10; // token submissions per 15 minutes
const COMPLETE_WINDOW = 15 * 60;

export type ResetRequestResult = { ok: true } | { ok: false; reason: "throttled" | "unavailable" };
export type ResetCompleteResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "throttled" | "failed" };

export const requestAdminReset = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().email().max(200) }).parse(data),
  )
  .handler(async ({ data }): Promise<ResetRequestResult> => {
    const { consumeQuota } = await import("@/lib/ratelimit.server");
    const {
      requesterFingerprint,
      requestOrigin,
      adminEmailMatches,
      sendResetEmail,
    } = await import("./reset.server");

    const who = requesterFingerprint();
    if (!(await consumeQuota(`admin-reset:${who}`, REQUEST_LIMIT, REQUEST_WINDOW))) {
      return { ok: false, reason: "throttled" };
    }

    // Always answer the same way; only a matching address triggers a send.
    if (!adminEmailMatches(data.email)) return { ok: true };

    const { createResetToken } = await import("./passcode.server");
    const token = await createResetToken(who);
    if (!token) return { ok: false, reason: "unavailable" };

    const outcome = await sendResetEmail(
      token,
      `${requestOrigin()}/admin/reset?token=${token}`,
    );
    if (outcome === "not_configured") return { ok: false, reason: "unavailable" };
    return { ok: true };
  });

export const checkResetToken = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string().max(200) }).parse(data))
  .handler(async ({ data }): Promise<{ valid: boolean }> => {
    const { isResetTokenValid } = await import("./passcode.server");
    return { valid: await isResetTokenValid(data.token) };
  });

export const completeAdminReset = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({ token: z.string().max(200), passcode: z.string().max(200) })
      .parse(data),
  )
  .handler(async ({ data }): Promise<ResetCompleteResult> => {
    try {
      const { consumeQuota } = await import("@/lib/ratelimit.server");
      const { requesterFingerprint } = await import("./reset.server");

      const who = requesterFingerprint();
      if (!(await consumeQuota(`admin-reset-complete:${who}`, COMPLETE_LIMIT, COMPLETE_WINDOW))) {
        return { ok: false, reason: "throttled" };
      }

      const { isResetTokenValid, markResetTokenUsed, setPasscode, credentialsVersion } =
        await import("./passcode.server");

      // The link is only burned after the passcode is safely stored, so a
      // failed save leaves it usable for another attempt.
      if (!(await isResetTokenValid(data.token))) return { ok: false, reason: "invalid" };
      if (!data.passcode) return { ok: false, reason: "failed" };
      if (!(await setPasscode(data.passcode))) return { ok: false, reason: "failed" };
      await markResetTokenUsed(data.token);

      // Sign the resetter straight in on the new credential version; every
      // other existing admin cookie is now stale and stops working.
      const { startAdminSession } = await import("./gate.server");
      await startAdminSession(await credentialsVersion());
      return { ok: true };
    } catch (err) {
      console.error("Admin reset completion threw", {
        message: err instanceof Error ? err.message : "unknown",
      });
      return { ok: false, reason: "failed" };
    }
  });

