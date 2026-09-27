import { useSyncExternalStore } from "react";

import { DEFAULT_TRANSLATION, type TranslationId } from "@/lib/translations";
import {
  getServerSnapshot,
  getSnapshot,
  hydrate,
  subscribe,
  type KjvDownloadState,
} from "./kjv-download";

/** Live download state for one translation, shared by the prompt and settings. */
export function useKjvDownload(
  translation: TranslationId = DEFAULT_TRANSLATION,
): KjvDownloadState {
  void hydrate(translation);
  return useSyncExternalStore(
    subscribe,
    () => getSnapshot(translation),
    getServerSnapshot,
  );
}
