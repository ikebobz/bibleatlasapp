import { useEffect, useState } from "react";

/**
 * Network availability. Assumes online until mounted so the server render and
 * the first client render agree.
 */
export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}

/** Non-reactive check for query functions. */
export function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
