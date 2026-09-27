import { useRouterState } from "@tanstack/react-router";

import { langFromPathname } from "@/lib/lang-routes";

/**
 * The chapter route for the language address being read (`/fr/$book/$chapter`),
 * or the English one. Keeps chapter-to-chapter navigation on the same address
 * instead of detouring through English and bouncing back.
 */
export function useChapterRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lang = langFromPathname(pathname);
  // Every language has a matching `/xx/$book/$chapter` route file; the cast
  // only narrows the literal for the typed Link/navigate API.
  return (lang ? `/${lang}/$book/$chapter` : "/$book/$chapter") as "/$book/$chapter";
}
