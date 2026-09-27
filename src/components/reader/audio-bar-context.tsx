import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AudioBridge = {
  playing: boolean;
  status: "idle" | "loading" | "ready" | "unavailable" | "no-translation-audio" | "error";
  toggle: () => void;
  options: boolean;
  setOptions: (open: boolean) => void;
};

type AudioBarState = {
  bridge: AudioBridge | null;
  setBridge: (bridge: AudioBridge | null) => void;
  combined: boolean;
  setCombined: (combined: boolean) => void;
};

const AudioBarContext = createContext<AudioBarState | null>(null);

export function AudioBarProvider({ children }: { children: ReactNode }) {
  const [bridge, setBridge] = useState<AudioBridge | null>(null);
  const [combined, setCombined] = useState(false);
  const value = useMemo(() => ({ bridge, setBridge, combined, setCombined }), [bridge, combined]);
  return <AudioBarContext.Provider value={value}>{children}</AudioBarContext.Provider>;
}

export function useAudioBar() {
  const value = useContext(AudioBarContext);
  if (!value) throw new Error("Audio bar requires AudioBarProvider");
  return value;
}
