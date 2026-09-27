/**
 * Keeps the address in step with the version being read: choosing Yorùbá in
 * the picker moves `/genesis/1` to `/yo/genesis/1`, and choosing KJV on a
 * language page moves back. Client-only, so crawlers (no saved setting) always
 * get the address they asked for. Exact-version links (`?t=`) are left alone.
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useTranslationSetting } from "@/components/reader/settings";
import { LANG_ROUTES, langForTranslation, langPath, type LangCode } from "@/lib/lang-routes";

export function LangAddressSync({ lang }: { lang?: LangCode }) {
  const translation = useTranslationSetting();
  const navigate = useNavigate();
  // On a language page the settings catch up to the route's version first;
  // don't react until they have, or we'd bounce straight back to English.
  const settled = useRef(!lang);

  useEffect(() => {
    if (lang && translation === LANG_ROUTES[lang]) settled.current = true;
    if (!settled.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("t")) return;
    const target = langForTranslation(translation);
    if (target === lang) return;
    // Only swap between English and language addresses for versions that have
    // one; other English versions (WEB, ASV…) stay on the English address.
    if (!target && !lang) return;
    const rest = lang
      ? window.location.pathname.replace(new RegExp(`^/${lang}`), "")
      : window.location.pathname;
    void navigate({
      href: langPath(target, rest) + window.location.search + window.location.hash,
      replace: true,
    });
  }, [translation, lang, navigate]);

  return null;
}
