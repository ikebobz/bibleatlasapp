/**
 * Push-device listing plus the passcode gate for the internal admin page.
 *
 * Admin dashboard data functions. Push endpoints are always masked before
 * being returned to the browser.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type AdminDevice = {
  id: string;
  endpoint: string;
  createdAt: string;
  lastSentAt: string | null;
  failureCount: number;
};

export type DevicesResult =
  | { locked: true }
  | { locked: false; devices: AdminDevice[]; total: number };

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "wrong" | "no_session" | "locked" | "error" };

export type EmailLoginRequestResult =
  | { ok: true }
  | { ok: false; reason: "throttled" | "unavailable" };

export type EmailLoginConfirmResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "no_session" | "throttled" };

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ passcode: z.string().min(1).max(200) }).parse(data),
  )
  .handler(async ({ data }): Promise<LoginResult> => {
    try {
      const { grantAdminSession } = await import("@/lib/admin/gate.server");
      return await grantAdminSession(data.passcode);
    } catch (err) {
      console.error("Admin login threw", {
        message: err instanceof Error ? err.message : "unknown",
      });
      return { ok: false, reason: "error" };
    }
  });

export const requestAdminEmailLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ email: z.string().email().max(200) }).parse(data),
  )
  .handler(async ({ data }): Promise<EmailLoginRequestResult> => {
    const { consumeQuota } = await import("@/lib/ratelimit.server");
    const { adminEmailMatches, requesterFingerprint, requestOrigin } = await import("./reset.server");
    const requester = requesterFingerprint();
    if (!(await consumeQuota(`admin-email-login:${requester}`, 5, 60 * 60))) {
      return { ok: false, reason: "throttled" };
    }
    // Keep the response identical when an address does not match.
    if (!adminEmailMatches(data.email)) return { ok: true };

    const { createLoginToken } = await import("./login-tokens.server");
    const token = await createLoginToken(requester);
    if (!token) return { ok: false, reason: "unavailable" };
    const { sendLoginEmail } = await import("./login-email.server");
    const outcome = await sendLoginEmail(
      token,
      `${requestOrigin()}/admin/sign-in?token=${token}`,
    );
    return outcome === "sent" ? { ok: true } : { ok: false, reason: "unavailable" };
  });

export const checkAdminEmailLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string().max(200) }).parse(data))
  .handler(async ({ data }): Promise<{ valid: boolean }> => {
    const { isLoginTokenValid } = await import("./login-tokens.server");
    return { valid: await isLoginTokenValid(data.token) };
  });

export const confirmAdminEmailLogin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string().max(200) }).parse(data))
  .handler(async ({ data }): Promise<EmailLoginConfirmResult> => {
    const { consumeQuota } = await import("@/lib/ratelimit.server");
    const { requesterFingerprint } = await import("./reset.server");
    if (!(await consumeQuota(`admin-email-confirm:${requesterFingerprint()}`, 10, 15 * 60))) {
      return { ok: false, reason: "throttled" };
    }
    const { claimLoginToken, releaseLoginToken } = await import("./login-tokens.server");
    if (!(await claimLoginToken(data.token))) return { ok: false, reason: "invalid" };

    const { credentialsVersion } = await import("./passcode.server");
    const { startAdminSession } = await import("./gate.server");
    if (!(await startAdminSession(await credentialsVersion()))) {
      await releaseLoginToken(data.token);
      return { ok: false, reason: "no_session" };
    }
    return { ok: true };
  });


export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearAdminSession } = await import("@/lib/admin/gate.server");
  await clearAdminSession();
  return { ok: true };
});

export const listPushDevices = createServerFn({ method: "GET" }).handler(
  async (): Promise<DevicesResult> => {
    const { isAdminSession, maskPushEndpoint } = await import("@/lib/admin/gate.server");
    if (!(await isAdminSession())) return { locked: true };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, created_at, last_sent_at, failure_count")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Admin device list failed", { code: error.code });
      return { locked: false, devices: [], total: 0 };
    }

    const devices = (data ?? []).map((row) => ({
      id: row.id,
      endpoint: maskPushEndpoint(row.endpoint),
      createdAt: row.created_at,
      lastSentAt: row.last_sent_at,
      failureCount: row.failure_count,
    }));
    return { locked: false, devices, total: devices.length };
  },
);
