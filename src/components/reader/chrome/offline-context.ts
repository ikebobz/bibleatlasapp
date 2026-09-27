import { createContext, useContext } from "react";

export type OfflineCtx = {
  online: boolean;
  stored: Set<string>;
  refreshStored: () => void;
};

export const OfflineContext = createContext<OfflineCtx>({
  online: true,
  stored: new Set(),
  refreshStored: () => {},
});

export function useOfflineLibrary() {
  return useContext(OfflineContext);
}
