import { CloudOff, RefreshCw, WifiOff } from "lucide-react";

import type { ChapterUnavailableReason } from "@/lib/chapter-query";

/**
 * Why a chapter could not be shown — told honestly.
 *
 * A network failure, a version that was never downloaded, and an empty result
 * are three different things; the reader used to call all of them "not saved
 * yet", which read like the Bible text itself was missing.
 */
export function OfflineChapterNotice({
  reason,
  reference,
  onRetry,
}: {
  reason: ChapterUnavailableReason;
  reference?: string;
  onRetry?: () => void;
}) {
  const notDownloaded = reason === "not-downloaded";
  const Icon = notDownloaded ? CloudOff : WifiOff;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <Icon aria-hidden className="mx-auto h-6 w-6 text-muted-foreground" />
        <h1 className="scripture mt-4 text-2xl text-foreground">
          {notDownloaded ? "You’re offline" : "This chapter didn’t load"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {notDownloaded ? (
            <>
              {reference ? `${reference} isn’t` : "This chapter isn’t"} saved on this device yet.
              While you’re connected, open the settings menu and download this version to read it
              without internet.
            </>
          ) : (
            <>Something went wrong reaching the Bible text. Check your connection and try again.</>
          )}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <RefreshCw aria-hidden className="h-3.5 w-3.5" /> Try again
            </button>
          )}
          <a
            href="/genesis/1"
            className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Open Genesis 1
          </a>
        </div>
      </div>
    </div>
  );
}
