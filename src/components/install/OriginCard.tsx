/**
 * Warns visitors of /install that they aren't on the canonical domain.
 *
 * Installing from anywhere else permanently pins the Home Screen app to that
 * origin, so this card is deliberately the loudest thing on the page.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, ExternalLink } from "lucide-react";

import { canonicalHere, shouldWarnAboutOrigin, SITE_HOST } from "@/lib/pwa/origin";

export function OriginCard({ onStatus }: { onStatus?: (offCanonical: boolean) => void }) {
  const [show, setShow] = useState(false);
  const [href, setHref] = useState(`https://${SITE_HOST}/install`);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const off = shouldWarnAboutOrigin();
    if (off) setHref(canonicalHere());
    setShow(off);
    onStatus?.(off);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            You're not on the official address
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Installing from this address would lock your Home Screen app to an old copy of Bible
            Atlas that can never update. Open <strong>{SITE_HOST}</strong> first, then follow the
            steps below.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
            >
              Open {SITE_HOST}
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copied ? "Link copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
