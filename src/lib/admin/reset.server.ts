/**
 * Email delivery for admin passcode resets.
 *
 * The recipient is fixed by the server-only ADMIN_EMAIL secret: the browser
 * submits an address, but we only ever send to the configured one, and the
 * UI response is identical whether or not the address matched.
 */

import { createHash } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { sendLovableEmail } from "@lovable.dev/email-js";

import { RESET_TOKEN_TTL_MINUTES } from "./passcode.server";
import { SITE_URL } from "@/lib/site";

/** Non-reversible fingerprint of the requester, for the audit column. */
export function requesterFingerprint(): string {
  let raw = "unknown";
  try {
    const headers = getRequest()?.headers;
    raw =
      headers?.get("cf-connecting-ip") ||
      (headers?.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
      headers?.get("x-real-ip") ||
      "unknown";
  } catch {
    /* no request context */
  }
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

/** Public base URL for emailed admin links (never localhost). */
export function requestOrigin(): string {
  try {
    const request = getRequest();
    if (request?.url) {
      const host =
        request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? undefined;
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      const candidate = host ? `${proto}://${host}` : new URL(request.url).origin;
      const { hostname, origin } = new URL(candidate);
      const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname.endsWith(".local");
      if (!isLocal) return origin;
    }
  } catch {
    /* fall through */
  }
  return SITE_URL;
}


export function adminEmailMatches(submitted: string): boolean {
  const configured = process.env["ADMIN_EMAIL"];
  if (!configured) return false;
  return submitted.trim().toLowerCase() === configured.trim().toLowerCase();
}

function senderDomain(): string | null {
  return process.env["EMAIL_SENDER_DOMAIN"] ?? process.env["LOVABLE_EMAIL_DOMAIN"] ?? null;
}

const styles = {
  body: "background-color:#ffffff;font-family:Georgia,'Times New Roman',serif;color:#2b2419;",
  card: "max-width:520px;margin:0 auto;padding:32px 28px;",
  button:
    "display:inline-block;background-color:#1f3a5f;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;",
  muted: "color:#6b6152;font-size:13px;line-height:1.6;",
};

function resetHtml(link: string): string {
  return `<!doctype html><html><body style="${styles.body}">
  <div style="${styles.card}">
    <p style="letter-spacing:.18em;font-size:11px;text-transform:uppercase;color:#6b6152;margin:0 0 18px;">Bible Atlas</p>
    <h1 style="font-size:24px;margin:0 0 12px;">Reset your admin passcode</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Use the link below to choose a new passcode for the Bible Atlas admin area. It works once and expires in ${RESET_TOKEN_TTL_MINUTES} minutes.</p>
    <p style="margin:0 0 28px;"><a href="${link}" style="${styles.button}">Set a new passcode</a></p>
    <p style="${styles.muted}">If the button does not work, paste this address into your browser:<br />${link}</p>
    <p style="${styles.muted}">Didn't request this? Nothing has changed — you can safely ignore this email.</p>
  </div></body></html>`;
}

function resetText(link: string): string {
  return `Reset your Bible Atlas admin passcode\n\nOpen this link to choose a new passcode. It works once and expires in ${RESET_TOKEN_TTL_MINUTES} minutes:\n${link}\n\nDidn't request this? Nothing has changed.`;
}

export type SendOutcome = "sent" | "not_configured" | "failed";

export async function sendResetEmail(token: string, link: string): Promise<SendOutcome> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const to = process.env["ADMIN_EMAIL"];
  const domain = senderDomain();

  if (!apiKey || !to || !domain) {
    console.error("Admin reset email not configured", {
      hasKey: Boolean(apiKey),
      hasRecipient: Boolean(to),
      hasDomain: Boolean(domain),
    });
    return "not_configured";
  }

  try {
    await sendLovableEmail(
      {
        to,
        from: `Bible Atlas <admin@${domain}>`,
        sender_domain: domain,
        subject: "Reset your Bible Atlas admin passcode",
        html: resetHtml(link),
        text: resetText(link),
        purpose: "transactional",
        idempotency_key: token,
      },
      { apiKey },
    );
    return "sent";
  } catch (error) {
    console.error("Admin reset email failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return "failed";
  }
}
