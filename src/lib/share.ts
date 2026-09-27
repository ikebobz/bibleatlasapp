import { defaultTranslationForLanguage } from "@/lib/translations";
import { langForTranslation, langPath } from "@/lib/lang-routes";
/**
 * Deep links and universal sharing.
 *
 * Every shared link is a real, server-rendered URL into the reader, carrying
 * the context the sender had on screen: the verse, the translation they were
 * reading, and any Atlas panel that was open. `s=share` marks the arrival as
 * share-sourced so the landing experience (install prompt, analytics) can
 * react to it without affecting normal reading.
 */

import { DEFAULT_TRANSLATION, getTranslation, type TranslationId } from "./translations";
import { SITE_URL } from "./site";

export { SITE_URL };

/**
 * Origin every shared link is built on.
 *
 * Always the canonical production domain — never `window.location.origin` —
 * so a verse shared from a preview, an installed app or an older host still
 * sends the recipient to mybibleatlas.com.
 */
export function siteOrigin() {
  return SITE_URL;
}


export type ShareChannel =
  | "native"
  | "whatsapp"
  | "telegram"
  | "facebook"
  | "x"
  | "linkedin"
  | "discord"
  | "email"
  | "sms"
  | "copy";

export type VerseShare = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference: string;
  /** Translation the sender was reading, carried to the recipient. */
  translation?: TranslationId;
  /** Atlas entry the sender had open, re-opened for the recipient. */
  entryId?: string;
};

/** Canonical deep link for a verse, with the sender's context attached. */
export function verseUrl(
  book: string,
  chapter: number,
  verse: number,
  opts: { translation?: TranslationId; lang?: string; entryId?: string; origin?: string } = {},
) {
  // Permanent verse path (v2.1). Older `?v=` links keep working.
  // Languages with their own address (/yo/john/3/16) use it; other versions
  // pin themselves with ?t=.
  const code = opts.lang
    ? langForTranslation(defaultTranslationForLanguage(opts.lang))
    : langForTranslation(opts.translation);
  const url = new URL(langPath(code, `/${book}/${chapter}/${verse}`), opts.origin ?? siteOrigin());
  if (code) {
    // the address itself carries the language
  } else if (opts.lang) {
    url.searchParams.set("lang", opts.lang);
  } else if (opts.translation && opts.translation !== DEFAULT_TRANSLATION) {
    url.searchParams.set("t", opts.translation);
  }
  if (opts.entryId) url.searchParams.set("ref", opts.entryId);
  url.searchParams.set("s", "share");
  return url.toString();
}

export function shareUrlFor(v: VerseShare) {
  return verseUrl(v.book, v.chapter, v.verse, {
    translation: v.translation,
    entryId: v.entryId,
  });
}

/** Language deep link for a verse: /john/3/16?lang=yo — no version id needed. */
export function verseLanguageUrl(
  book: string,
  chapter: number,
  verse: number,
  lang: string,
  opts: { origin?: string } = {},
) {
  return verseUrl(book, chapter, verse, { lang, origin: opts.origin });
}

/** Deep link to an Atlas entry, opened over the chapter it was read in. */
export function entryUrl(
  entryId: string,
  ctx: { book: string; chapter: number; verse?: number; translation?: TranslationId },
) {
  const url = new URL(`/${ctx.book}/${ctx.chapter}`, siteOrigin());
  if (ctx.verse) url.searchParams.set("v", String(ctx.verse));
  if (ctx.translation && ctx.translation !== DEFAULT_TRANSLATION)
    url.searchParams.set("t", ctx.translation);
  url.searchParams.set("ref", entryId);
  url.searchParams.set("s", "share");
  return url.toString();
}

/** Deep link to a thread/connection node. */
export function threadUrl(nodeId: string) {
  return `${siteOrigin()}/connections/${nodeId}?s=share`;
}

export function verseShareText(text: string, reference: string) {
  return `“${text.trim()}” — ${reference}`;
}

/** Reference as shared: "John 3:16, KJV" — the recipient sees the version too. */
export function referenceWithVersion(v: VerseShare) {
  return `${v.reference}, ${getTranslation(v.translation ?? DEFAULT_TRANSLATION).label}`;
}

const CTA = "Explore this verse in Bible Atlas";

/** The body every channel shares: verse, reference, call to action, link. */
export function verseShareBody(v: VerseShare) {
  return `${verseShareText(v.text, referenceWithVersion(v))}\n\n${CTA}:\n${shareUrlFor(v)}`;
}

/**
 * Opens a third-party share destination from an embedded or mobile context.
 *
 * Strategies, in order of how well they survive real browsers:
 *  1. A synthetic `<a target="_blank" rel="noopener">` click — the form iOS
 *     Safari and Android in-app webviews (Instagram, Facebook, Gmail) handle
 *     most reliably, because it looks like a normal link activation.
 *  2. `window.open` with a blank window whose location is replaced afterwards,
 *     for desktop browsers where popups are allowed.
 *  3. A top-level navigation (breaking out of the Lovable preview iframe when
 *     that frame is same-origin-navigable), used only when nothing else can
 *     run — the reader is restored with the back button.
 *
 * Returns false when every strategy is blocked so the caller can offer copy.
 */
export function openExternalShare(url: string): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  let destination: string;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    destination = parsed.toString();
  } catch {
    return false;
  }

  // 1. Anchor activation — best support in iOS Safari and Android webviews.
  try {
    const a = document.createElement("a");
    a.href = destination;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    /* fall through */
  }

  // 2. Popup window.
  try {
    const opened = window.open(destination, "_blank", "noopener,noreferrer");
    if (opened) return true;
  } catch {
    /* fall through */
  }

  // 3. Last resort: top-level navigation out of the embedded frame.
  try {
    const top = window.top;
    if (top && top !== window.self) {
      top.location.href = destination;
      return true;
    }
  } catch {
    /* cross-origin top frame: cannot navigate it */
  }
  try {
    window.location.href = destination;
    return true;
  } catch {
    return false;
  }
}


/**
 * Tries the native OS share sheet.
 *
 * Returns true only when the share was actually handled (it resolved, or the
 * user deliberately cancelled it). Some browsers expose `navigator.share` but
 * reject the call — in an iframe without the web-share permission, in embedded
 * webviews, on desktop engines that only stub the API. Those must report false
 * so the caller can open the in-app share sheet instead of silently doing
 * nothing.
 */
export async function nativeShare(payload: {
  title?: string;
  text?: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  try {
    if (typeof navigator.canShare === "function" && !navigator.canShare(payload)) return false;
  } catch {
    return false;
  }
  try {
    await navigator.share(payload);
    return true;
  } catch (err) {
    // Only a deliberate cancel counts as handled; anything else is a failure.
    return (err as { name?: string } | null)?.name === "AbortError";
  }
}

export async function shareVerse(v: VerseShare): Promise<boolean> {
  return nativeShare({
    title: referenceWithVersion(v),
    text: `${verseShareText(v.text, referenceWithVersion(v))}\n\n${CTA}:`,
    url: shareUrlFor(v),
  });
}


export function shareTargets(v: VerseShare) {
  const url = shareUrlFor(v);
  const quote = verseShareText(v.text, referenceWithVersion(v));
  const body = verseShareBody(v);
  const e = encodeURIComponent;
  return {
    url,
    body,
    quote,
    whatsapp: `https://wa.me/?text=${e(body)}`,
    telegram: `https://t.me/share/url?url=${e(url)}&text=${e(quote)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}&quote=${e(quote)}`,
    x: `https://twitter.com/intent/tweet?text=${e(quote)}&url=${e(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`,
    email: `mailto:?subject=${e(referenceWithVersion(v))}&body=${e(body)}`,
    sms: `sms:?&body=${e(body)}`,
  };
}

/**
 * Bumped whenever the card artwork changes.
 *
 * Messaging platforms cache a preview image by URL and never re-fetch it, so a
 * new version marker is the only way to make WhatsApp, iMessage, Facebook and
 * X pick up a redrawn card.
 */
export const CARD_VERSION = "3";

/** Absolute URL of the generated preview card for a verse. */
export function verseCardUrl(params: {
  book: string;
  chapter: number;
  verse?: number;
  reference: string;
  text?: string;
  translation?: TranslationId;
  origin?: string;
}) {
  const url = new URL("/api/public/og/verse", params.origin ?? SITE_URL);
  url.searchParams.set("ref", params.reference);
  url.searchParams.set("book", params.book);
  url.searchParams.set("chapter", String(params.chapter));
  if (params.verse) url.searchParams.set("verse", String(params.verse));
  if (params.translation && params.translation !== DEFAULT_TRANSLATION) {
    url.searchParams.set("t", params.translation);
  }
  if (params.text) url.searchParams.set("text", params.text.slice(0, 400));
  url.searchParams.set("v", CARD_VERSION);
  return url.toString();
}

