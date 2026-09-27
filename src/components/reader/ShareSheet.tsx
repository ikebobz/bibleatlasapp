import { useRef, useState } from "react";
import {
  Check,
  Facebook,
  Link2,
  Linkedin,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
  Share2,
  Twitter,
} from "lucide-react";

import {
  openExternalShare,
  shareTargets,
  type ShareChannel,
  type VerseShare,
} from "@/lib/share";
import { trackShare } from "@/lib/analytics/share-events";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";

export function ShareSheet({
  verse,
  rect,
  onClose,
}: {
  verse: VerseShare;
  rect: DOMRect;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<"link" | "discord" | null>(null);
  const [blockedChannel, setBlockedChannel] = useState<ShareChannel | null>(null);
  const targets = shareTargets(verse);

  useDismissibleLayer({ refs: [ref], onDismiss: onClose, dismissOnScroll: true });

  const sent = (channel: ShareChannel) =>
    trackShare("share_sent", {
      channel,
      resourceType: "verse",
      resourceRef: verse.reference,
      translation: verse.translation,
    });

  const width = 244;
  const viewportW = typeof window !== "undefined" ? window.innerWidth : 800;
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 900;
  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), viewportW - width - 8);
  const estimated = 330;
  const top =
    rect.bottom + 8 + estimated > viewportH ? Math.max(8, viewportH - estimated - 8) : rect.bottom + 8;

  const item =
    "inline-flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  // Embedded webviews (Instagram, Facebook, Gmail) and iOS standalone PWAs can
  // swallow an external handoff without reporting failure, so the sheet stays
  // open with a copy fallback instead of closing optimistically.
  const openTarget = (channel: ShareChannel, url: string) => {
    const handed = openExternalShare(url);
    if (handed) sent(channel);
    setBlockedChannel(channel);
  };


  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Share ${verse.reference}`}
      style={{ position: "fixed", left, top, width, maxHeight: "80vh" }}
      className="z-50 animate-in fade-in zoom-in-95 overflow-y-auto rounded-xl border bg-popover p-2 shadow-lg"
    >
      <p className="flex items-center gap-1.5 px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Share2 className="h-3 w-3" /> Share {verse.reference}
      </p>
      <button
        type="button"
        className={item}
        onClick={() => openTarget("whatsapp", targets.whatsapp)}
      >
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
      </button>
      <button
        type="button"
        className={item}
        onClick={() => openTarget("telegram", targets.telegram)}
      >
        <Send className="h-3.5 w-3.5" /> Telegram
      </button>
      <button
        type="button"
        className={item}
        onClick={() => openTarget("facebook", targets.facebook)}
      >
        <Facebook className="h-3.5 w-3.5" /> Facebook
      </button>
      <button
        type="button"
        className={item}
        onClick={() => openTarget("x", targets.x)}
      >
        <Twitter className="h-3.5 w-3.5" /> X
      </button>
      <button
        type="button"
        className={item}
        onClick={() => openTarget("linkedin", targets.linkedin)}
      >
        <Linkedin className="h-3.5 w-3.5" /> LinkedIn
      </button>
      <button
        type="button"
        className={item}
        onClick={() => {
          void navigator.clipboard?.writeText(targets.body);
          sent("discord");
          setCopied("discord");
          setTimeout(onClose, 900);
        }}
      >
        {copied === "discord" ? <Check className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
        {copied === "discord" ? "Copied for Discord" : "Discord"}
      </button>
      <a
        className={item}
        href={targets.email}
        onClick={() => {
          sent("email");
          onClose();
        }}
      >
        <Mail className="h-3.5 w-3.5" /> Email
      </a>
      <a
        className={item}
        href={targets.sms}
        onClick={() => {
          sent("sms");
          onClose();
        }}
      >
        <MessageSquare className="h-3.5 w-3.5" /> Text message
      </a>
      <button
        type="button"
        className={item}
        onClick={() => {
          void navigator.clipboard?.writeText(targets.body);
          sent("copy");
          setCopied("link");
          setTimeout(onClose, 900);
        }}
      >
        {copied === "link" ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied === "link" ? "Link copied" : "Copy link"}
      </button>
      {blockedChannel && (
        <div role="status" className="mt-1 border-t px-2 pt-2 text-xs text-muted-foreground">
          <p>
            Opening{" "}
            {blockedChannel === "x"
              ? "X"
              : blockedChannel.charAt(0).toUpperCase() + blockedChannel.slice(1)}
            … if nothing happened, your browser blocked it.
          </p>

          <button
            type="button"
            className="mt-1 font-semibold text-primary hover:underline"
            onClick={() => {
              void navigator.clipboard?.writeText(targets.body);
              sent("copy");
              setCopied("link");
              setBlockedChannel(null);
              setTimeout(onClose, 900);
            }}
          >
            Copy share text instead
          </button>
        </div>
      )}

    </div>
  );
}
