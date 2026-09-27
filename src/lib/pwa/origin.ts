/**
 * Canonical-origin helpers for the install flow.
 *
 * A Home Screen app is permanently bound to the origin it was installed from.
 * Anyone who adds Bible Atlas from an old Lovable host keeps launching that
 * host's cached shell forever, which is how users end up stuck on an old build
 * with missing translations. The install UI uses these helpers to steer people
 * onto mybibleatlas.com before they tap Add.
 */

import { SITE_HOST, SITE_URL } from "@/lib/site";

/** Editor preview / dev hosts: not canonical, but never worth nagging about. */
export function isPreviewHost(hostname = currentHost()): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname.endsWith(".lovableproject.com") ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

function currentHost(): string {
  if (typeof window === "undefined") return SITE_HOST;
  return window.location.hostname;
}

/** True when the page is served from the real production domain. */
export function isCanonicalOrigin(): boolean {
  if (typeof window === "undefined") return true;
  const host = window.location.host;
  return host === SITE_HOST || host === `www.${SITE_HOST}` || `www.${host}` === SITE_HOST;
}

/**
 * True when we should actively warn: a real, public host that is not the
 * canonical domain. Preview and dev hosts are excluded.
 */
export function shouldWarnAboutOrigin(): boolean {
  if (typeof window === "undefined") return false;
  if (isCanonicalOrigin()) return false;
  return !isPreviewHost();
}

/** The same page on the canonical domain. */
export function canonicalHere(): string {
  if (typeof window === "undefined") return SITE_URL;
  const url = new URL(window.location.pathname + window.location.search, SITE_URL);
  return url.toString();
}

export { SITE_HOST, SITE_URL };
