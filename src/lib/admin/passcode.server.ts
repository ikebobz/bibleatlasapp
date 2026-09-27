/**
 * Admin passcode storage and reset tokens.
 *
 * The passcode lives in `public.admin_credentials` as a PBKDF2-SHA256 hash
 * with a per-record salt — never in plain text. The `ADMIN_PASSCODE` secret
 * remains the fallback until the first reset writes a row, so nothing breaks
 * during the transition.
 *
 * Reset links are random 32-byte tokens; only their SHA-256 hash is stored,
 * so a database leak cannot be replayed as a reset.
 */

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * The edge runtime (workerd) refuses PBKDF2 above 100k iterations, so that is
 * the ceiling we hash at. Older rows record their own iteration count.
 */
const ITERATIONS = 100_000;
const LEGACY_ITERATIONS = 210_000;
const KEY_LENGTH = 32;
const TOKEN_TTL_MS = 30 * 60 * 1000;

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(size: number): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/** PBKDF2 through WebCrypto — available in the worker runtime. */
async function derive(
  passcode: string,
  saltHex: string,
  iterations: number = ITERATIONS,
): Promise<string | null> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(passcode), "PBKDF2", false, [
      "deriveBits",
    ]);
    const salt = Uint8Array.from(saltHex.match(/.{2}/g) ?? [], (b) => parseInt(b, 16));
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      key,
      KEY_LENGTH * 8,
    );
    return toHex(bits);
  } catch (err) {
    // workerd rejects iteration counts above 100k; legacy rows can hit this.
    console.error("PBKDF2 derive failed", {
      iterations,
      message: err instanceof Error ? err.message : "unknown",
    });
    return null;
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

type Credentials = {
  passcode_hash: string;
  salt: string;
  version: number;
  iterations: number;
};

let lastReadFailed = false;

async function readCredentials(): Promise<Credentials | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_credentials")
    .select("passcode_hash, salt, version, iterations")
    .eq("id", true)
    .maybeSingle();
  if (error) {
    lastReadFailed = true;
    console.error("Admin credential read failed", { code: error.code });
    return null;
  }
  lastReadFailed = false;
  if (!data) return null;
  const row = data as unknown as Partial<Credentials>;
  return {
    passcode_hash: row.passcode_hash ?? "",
    salt: row.salt ?? "",
    version: row.version ?? 0,
    iterations: row.iterations ?? LEGACY_ITERATIONS,
  };
}

/** Current credential version; session cookies carry it so resets log everyone out. */
export async function credentialsVersion(): Promise<number> {
  return (await readCredentials())?.version ?? 0;
}

/**
 * Version plus whether the lookup itself failed, so callers can avoid
 * signing an admin out over a transient database error.
 */
export async function credentialsVersionState(): Promise<{
  version: number;
  readFailed: boolean;
}> {
  const row = await readCredentials();
  return { version: row?.version ?? 0, readFailed: lastReadFailed };
}


/** Verify a submitted passcode against the stored hash, or the legacy secret. */
export async function verifyPasscode(passcode: string): Promise<boolean> {
  const stored = await readCredentials();
  if (stored) {
    const candidate = await derive(passcode, stored.salt, stored.iterations);
    if (candidate === null) return false;
    return safeEqual(candidate, stored.passcode_hash);
  }

  const expected = process.env["ADMIN_PASSCODE"];
  if (!expected) {
    console.error("ADMIN_PASSCODE is not configured and no stored credential exists");
    return false;
  }
  return safeEqual(passcode, expected);
}

/** Store a new passcode and bump the version, invalidating existing sessions. */
export async function setPasscode(passcode: string): Promise<boolean> {
  try {
    const salt = randomHex(16);
    const hash = await derive(passcode, salt, ITERATIONS);
    if (hash === null) {
      console.error("Admin passcode hashing failed");
      return false;
    }
    const nextVersion = ((await readCredentials())?.version ?? 0) + 1;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("admin_credentials").upsert(
      {
        id: true,
        passcode_hash: hash,
        salt,
        version: nextVersion,
        iterations: ITERATIONS,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "id" },
    );
    if (error) {
      console.error("Admin passcode write failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return false;
    }

    // Confirm the row really changed before telling the caller it worked.
    const stored = await readCredentials();
    if (!stored || !safeEqual(stored.passcode_hash, hash)) {
      console.error("Admin passcode write did not persist");
      return false;
    }
    return true;
  } catch (err) {
    console.error("Admin passcode write threw", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}


/** Mint a reset token; only its hash is persisted. Returns the raw token. */
export async function createResetToken(requesterHash: string): Promise<string | null> {
  const token = randomHex(32);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Housekeeping: drop anything already expired or spent.
  await supabaseAdmin
    .from("admin_reset_tokens")
    .delete()
    .lt("expires_at", new Date(Date.now() - TOKEN_TTL_MS).toISOString());

  const { error } = await supabaseAdmin.from("admin_reset_tokens").insert({
    token_hash: hashToken(token),
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    requester_hash: requesterHash,
  });
  if (error) {
    console.error("Reset token insert failed", { code: error.code });
    return null;
  }
  return token;
}

/** True when the token exists, is unspent and unexpired. Does not consume it. */
export async function isResetTokenValid(token: string): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/.test(token)) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_reset_tokens")
    .select("id, expires_at, used_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (error || !data) return false;
  return !data.used_at && new Date(data.expires_at).getTime() > Date.now();
}

/**
 * Mark a token as spent. Only called AFTER the new passcode is safely stored,
 * so a failed save leaves the link usable instead of burning it.
 */
export async function markResetTokenUsed(token: string): Promise<boolean> {
  if (!/^[0-9a-f]{64}$/.test(token)) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("admin_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hashToken(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("id");
  if (error) {
    console.error("Reset token mark-used failed", {
      code: error.code,
      message: error.message,
    });
    return false;
  }
  return (data?.length ?? 0) > 0;
}


export const RESET_TOKEN_TTL_MINUTES = TOKEN_TTL_MS / 60000;
