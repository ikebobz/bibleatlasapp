import { sendLovableEmail } from "@lovable.dev/email-js";

import { LOGIN_TOKEN_TTL_MINUTES } from "./login-tokens.server";

const bodyStyle = "background-color:#ffffff;font-family:Georgia,'Times New Roman',serif;color:#2b2419;";
const cardStyle = "max-width:520px;margin:0 auto;padding:32px 28px;";
const buttonStyle =
  "display:inline-block;background-color:#1f3a5f;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:15px;";
const mutedStyle = "color:#6b6152;font-size:13px;line-height:1.6;";

export type LoginEmailOutcome = "sent" | "not_configured" | "failed";

export async function sendLoginEmail(token: string, link: string): Promise<LoginEmailOutcome> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  const to = process.env["ADMIN_EMAIL"];
  const domain = process.env["EMAIL_SENDER_DOMAIN"] ?? process.env["LOVABLE_EMAIL_DOMAIN"];
  if (!apiKey || !to || !domain) return "not_configured";

  const html = `<!doctype html><html><body style="${bodyStyle}"><div style="${cardStyle}">
    <p style="letter-spacing:.18em;font-size:11px;text-transform:uppercase;color:#6b6152;margin:0 0 18px;">Bible Atlas</p>
    <h1 style="font-size:24px;margin:0 0 12px;">Sign in to Bible Atlas admin</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Open the secure sign-in page below. The link works once and expires in ${LOGIN_TOKEN_TTL_MINUTES} minutes.</p>
    <p style="margin:0 0 28px;"><a href="${link}" style="${buttonStyle}">Review sign-in</a></p>
    <p style="${mutedStyle}">The page will ask you to confirm before signing in. If the button does not work, paste this address into your browser:<br />${link}</p>
    <p style="${mutedStyle}">Didn't request this? You can safely ignore this email.</p>
  </div></body></html>`;
  const text = `Sign in to Bible Atlas admin\n\nOpen this link, then confirm the sign-in. It works once and expires in ${LOGIN_TOKEN_TTL_MINUTES} minutes:\n${link}\n\nDidn't request this? You can safely ignore this email.`;

  try {
    await sendLovableEmail(
      {
        to,
        from: `Bible Atlas <admin@${domain}>`,
        sender_domain: domain,
        subject: "Your Bible Atlas admin sign-in link",
        html,
        text,
        purpose: "transactional",
        idempotency_key: `admin-login-${token}`,
      },
      { apiKey },
    );
    return "sent";
  } catch (error) {
    console.error("Admin login email failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return "failed";
  }
}