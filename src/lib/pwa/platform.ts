/**
 * Unified platform detection for the install experience.
 *
 * iOS Safari never fires `beforeinstallprompt` and exposes no JS install API,
 * so the UI must branch on the platform instead of pretending one button works
 * everywhere. Everything here is browser-only and safe to call after mount.
 */

export type PlatformKind = "iphone" | "ipad" | "android" | "desktop" | "unknown";

export type PlatformInfo = {
  kind: PlatformKind;
  isIos: boolean;
  /** Real Safari on iOS — the only iOS browser that can add to the Home Screen. */
  isIosSafari: boolean;
  /** Instagram / Facebook / Gmail etc. — installation is impossible in here. */
  isInAppBrowser: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  browser: string;
};

const IN_APP_RE =
  /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|TikTok|Snapchat|Pinterest|LinkedInApp|GSA\/|MicroMessenger|WhatsApp|EdgiOS|CriOS|FxiOS|OPiOS|DuckDuckGo/i;

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const mmFullscreen = window.matchMedia?.("(display-mode: fullscreen)").matches ?? false;
  const iosFlag = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return mm || mmFullscreen || iosFlag;
}

function browserName(ua: string): string {
  if (/CriOS|Chrome\//.test(ua)) return "chrome";
  if (/FxiOS|Firefox\//.test(ua)) return "firefox";
  if (/EdgiOS|Edg\//.test(ua)) return "edge";
  if (/SamsungBrowser/.test(ua)) return "samsung";
  if (/Safari\//.test(ua)) return "safari";
  return "other";
}

export function detectPlatform(): PlatformInfo {
  if (typeof navigator === "undefined") {
    return {
      kind: "unknown",
      isIos: false,
      isIosSafari: false,
      isInAppBrowser: false,
      isAndroid: false,
      isStandalone: false,
      browser: "unknown",
    };
  }

  const ua = navigator.userAgent;
  const touchPoints = navigator.maxTouchPoints ?? 0;
  const isIphone = /iPhone|iPod/.test(ua);
  // iPadOS 13+ reports itself as a Macintosh but is the only "Mac" with touch.
  const isIpad = /iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
  const isIos = isIphone || isIpad;
  const isAndroid = /Android/.test(ua);
  const isInAppBrowser = IN_APP_RE.test(ua);
  const browser = browserName(ua);

  const kind: PlatformKind = isIphone
    ? "iphone"
    : isIpad
      ? "ipad"
      : isAndroid
        ? "android"
        : /Windows|Macintosh|Linux|CrOS/.test(ua)
          ? "desktop"
          : "unknown";

  return {
    kind,
    isIos,
    // Chrome/Firefox/Edge on iOS ship a Safari UA string but no Add to Home Screen.
    isIosSafari: isIos && !isInAppBrowser && browser === "safari",
    isInAppBrowser,
    isAndroid,
    isStandalone: isStandaloneDisplay(),
    browser,
  };
}

export function platformLabel(kind: PlatformKind): string {
  switch (kind) {
    case "iphone":
      return "iPhone";
    case "ipad":
      return "iPad";
    case "android":
      return "Android";
    case "desktop":
      return "Desktop";
    default:
      return "Other";
  }
}
