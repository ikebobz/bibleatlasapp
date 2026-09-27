/**
 * Server-side access control for the internal admin pages.
 *
 * Access requires a signed, httpOnly session cookie that is only issued after
 * the visitor proves knowledge of ADMIN_PASSCODE. Every admin server function
 * checks `isAdminSession()` before touching the service-role client, so the
 * endpoints are protected even when called directly over HTTP.
 */

import { getCookie, getRequestProtocol, useSession } from "@tanstack/react-start/server";

/** Only mark the cookie Secure when the request is actually served over TLS. */
function isSecureRequest(): boolean {
  try {
    return getRequestProtocol() === "https";
  } catch {
    return true;
  }
}


const SESSION_NAME = "atlas_admin";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

type AdminSessionData = { admin?: boolean; grantedAt?: number; version?: number };

function sessionPassword(): string | null {
  const secret = process.env["SESSION_SECRET"];
  // hookable seal requires a reasonably long password
  if (!secret || secret.length < 32) return null;
  return secret;
}

/** True when the incoming request already carries an admin session cookie. */
function hasSessionCookie(): boolean {
  try {
    return Boolean(getCookie(SESSION_NAME));
  } catch {
    return false;
  }
}

async function adminSession() {
  const password = sessionPassword();
  if (!password) return null;
  return useSession<AdminSessionData>({
    password,
    name: SESSION_NAME,
    maxAge: SESSION_MAX_AGE,
    cookie: { httpOnly: true, sameSite: "lax", secure: isSecureRequest(), path: "/" },
  });
}

/**
 * True when the current request carries a valid admin session cookie whose
 * credential version still matches — a passcode reset invalidates older ones.
 * A failed version lookup keeps the session rather than logging the user out.
 */
export async function isAdminSession(): Promise<boolean> {
  try {
    // Reading a session mints and re-issues the cookie. Every anonymous
    // request would then hand the browser a fresh, empty session — clobbering
    // the one just granted by a successful login. Only open the session when
    // the request actually carries the cookie.
    if (!hasSessionCookie()) return false;
    const session = await adminSession();
    if (session?.data.admin !== true) return false;
    const { credentialsVersionState } = await import("./passcode.server");
    const { version, readFailed } = await credentialsVersionState();
    if (readFailed) {
      console.error("Credential version lookup failed; keeping admin session");
      return true;
    }
    const cookieVersion = session.data.version ?? 0;
    if (cookieVersion !== version) {
      console.error("Admin session version mismatch", { cookieVersion, version });
      return false;
    }
    return true;
  } catch (err) {
    console.error("Admin session read failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}

export type GrantResult =
  | { ok: true }
  | { ok: false; reason: "wrong" | "no_session" | "locked" };

/** Brute-force ceilings for the passcode form. */
const LOGIN_BURST_LIMIT = 5; // attempts per visitor
const LOGIN_BURST_WINDOW = 5 * 60; // ...per 5 minutes
const LOGIN_HOURLY_LIMIT = 20; // attempts per visitor per hour
const LOGIN_HOUR_WINDOW = 60 * 60;
const LOGIN_GLOBAL_LIMIT = 200; // whole app per hour

/**
 * Count this login attempt. Returns false once the visitor (or the app as a
 * whole) is temporarily locked out, so repeated guessing stops cheaply.
 */
async function allowLoginAttempt(): Promise<boolean> {
  const { consumeQuota, visitorKey } = await import("@/lib/ratelimit.server");
  const visitor = visitorKey();
  const [burstOk, hourlyOk, globalOk] = await Promise.all([
    consumeQuota(`admin-login:${visitor}`, LOGIN_BURST_LIMIT, LOGIN_BURST_WINDOW),
    consumeQuota(`admin-login-h:${visitor}`, LOGIN_HOURLY_LIMIT, LOGIN_HOUR_WINDOW),
    consumeQuota(`admin-login-global`, LOGIN_GLOBAL_LIMIT, LOGIN_HOUR_WINDOW),
  ]);
  if (!burstOk || !hourlyOk || !globalOk) {
    console.error("Admin login locked out", { burstOk, hourlyOk, globalOk });
    return false;
  }
  return true;
}

/** Compare the submitted passcode with the stored one and open a session. */
export async function grantAdminSession(passcode: string): Promise<GrantResult> {
  if (typeof passcode !== "string" || passcode.length > 200) {
    return { ok: false, reason: "wrong" };
  }

  if (!(await allowLoginAttempt())) return { ok: false, reason: "locked" };

  const { verifyPasscode, credentialsVersion } = await import("./passcode.server");
  if (!(await verifyPasscode(passcode))) return { ok: false, reason: "wrong" };

  const started = await startAdminSession(await credentialsVersion());
  return started ? { ok: true } : { ok: false, reason: "no_session" };
}

/** Open an admin session without a passcode check (callers must authorise). */
export async function startAdminSession(version: number): Promise<boolean> {
  const secret = process.env["SESSION_SECRET"];
  if (!secret || secret.length < 32) {
    console.error("SESSION_SECRET missing or too short; admin login disabled", {
      present: Boolean(secret),
      length: secret?.length ?? 0,
    });
    return false;
  }
  try {
    const session = await adminSession();
    if (!session) return false;
    await session.update({ admin: true, grantedAt: Date.now(), version });
    return true;
  } catch (err) {
    console.error("Admin session write failed", {
      message: err instanceof Error ? err.message : "unknown",
    });
    return false;
  }
}


export async function clearAdminSession(): Promise<void> {
  const session = await adminSession();
  await session?.clear();
}

/** Show only enough of an endpoint to tell devices apart. */
export function maskPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    const tail = url.pathname.replace(/\/+$/, "").slice(-8);
    return `${url.host}/…${tail}`;
  } catch {
    return `…${endpoint.slice(-8)}`;
  }
}
