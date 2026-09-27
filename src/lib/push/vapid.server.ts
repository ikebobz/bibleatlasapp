/**
 * Web push transport: VAPID (RFC 8292) request signing with Web Crypto.
 *
 * Bible Atlas sends payload-free pushes. The service worker fetches today's
 * verse itself, so nothing needs the aes128gcm content encoding and no
 * scripture ever passes through a third-party push service.
 */

function b64urlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function textToB64url(value: string): string {
  return bytesToB64url(new TextEncoder().encode(value));
}

async function importSigningKey(publicKey: string, privateKey: string) {
  const raw = b64urlToBytes(publicKey);
  if (raw.length !== 65 || raw[0] !== 4) throw new Error("VAPID public key must be 65 raw bytes");
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: bytesToB64url(raw.slice(1, 33)),
    y: bytesToB64url(raw.slice(33)),
    d: privateKey,
    ext: true,
  };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, [
    "sign",
  ]);
}

async function vapidHeader(endpoint: string) {
  const publicKey = process.env["VAPID_PUBLIC_KEY"];
  const privateKey = process.env["VAPID_PRIVATE_KEY"];
  const subject = process.env["VAPID_SUBJECT"] ?? "mailto:notifications@mybibleatlas.com";
  if (!publicKey || !privateKey) throw new Error("VAPID keys are not configured");

  const audience = new URL(endpoint).origin;
  const header = textToB64url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const payload = textToB64url(
    JSON.stringify({
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: subject,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const key = await importSigningKey(publicKey, privateKey);
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key,
      new TextEncoder().encode(unsigned)),
  );
  return `vapid t=${unsigned}.${bytesToB64url(signature)}, k=${publicKey}`;
}

export type PushResult = { ok: boolean; status: number; gone: boolean };

/** Send one payload-free push. */
export async function sendPush(endpoint: string, ttlSeconds = 6 * 60 * 60): Promise<PushResult> {
  let status = 0;
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: await vapidHeader(endpoint),
        TTL: String(ttlSeconds),
        Urgency: "normal",
        "Content-Length": "0",
      },
    });
    status = res.status;
  } catch {
    return { ok: false, status: 0, gone: false };
  }
  return { ok: status >= 200 && status < 300, status, gone: status === 404 || status === 410 };
}
