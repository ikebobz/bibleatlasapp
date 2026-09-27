import { createHash } from "node:crypto";

const TOKEN_TTL_MS = 15 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function validTokenShape(token: string): boolean {
  return /^[0-9a-f]{64}$/.test(token);
}

export async function createLoginToken(requesterHash: string): Promise<string | null> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  await supabaseAdmin
    .from("admin_login_tokens")
    .delete()
    .lt("expires_at", new Date().toISOString());

  const { error } = await supabaseAdmin.from("admin_login_tokens").insert({
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    requester_hash: requesterHash,
  });
  if (error) {
    console.error("Admin login token insert failed", { code: error.code });
    return null;
  }
  return token;
}

export async function isLoginTokenValid(token: string): Promise<boolean> {
  if (!validTokenShape(token)) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_login_tokens")
    .select("id")
    .eq("token_hash", hashToken(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return !error && Boolean(data);
}

/** Atomically claim a token so two confirmation requests cannot both use it. */
export async function claimLoginToken(token: string): Promise<boolean> {
  if (!validTokenShape(token)) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_login_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hashToken(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  return !error && (data?.length ?? 0) === 1;
}

export async function releaseLoginToken(token: string): Promise<void> {
  if (!validTokenShape(token)) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("admin_login_tokens")
    .update({ used_at: null })
    .eq("token_hash", hashToken(token));
}

export const LOGIN_TOKEN_TTL_MINUTES = TOKEN_TTL_MS / 60000;