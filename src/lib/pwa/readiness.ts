/**
 * Offline readiness checks used by the /install checklist.
 *
 * Everything here is browser-only and read-only: it inspects what the browser
 * already has, so a visitor can see exactly why offline reading would or would
 * not work on their device right now.
 */

import { storedChapterKeys } from "@/lib/offline/chapter-store";
import { detectPlatform } from "./platform";
import { serviceWorkerAllowed } from "./register-sw";

export type CheckStatus = "ready" | "missing" | "info" | "unavailable";

export type ReadinessCheck = {
  id: "support" | "installed" | "worker" | "shell" | "bible";
  label: string;
  status: CheckStatus;
  detail: string;
  action?: "register" | "download" | "install";
};

async function shellCached(): Promise<boolean> {
  try {
    if (!("caches" in window)) return false;
    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      const match = (await cache.match("/")) ?? (await cache.match("/index.html"));
      if (match) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function runReadinessChecks(): Promise<ReadinessCheck[]> {
  const info = detectPlatform();
  const supported = typeof navigator !== "undefined" && "serviceWorker" in navigator;
  const allowed = serviceWorkerAllowed();

  const checks: ReadinessCheck[] = [];

  checks.push({
    id: "support",
    label: "Your browser supports offline reading",
    status: supported ? "ready" : "unavailable",
    detail: supported
      ? "Service workers are available in this browser."
      : "This browser can't store the app for offline use. Try Safari on iPhone or Chrome on Android.",
  });

  checks.push({
    id: "installed",
    label: "Running as an installed app",
    status: info.isStandalone ? "ready" : "info",
    detail: info.isStandalone
      ? "You opened Bible Atlas from your Home Screen."
      : "Optional, but installing gives full-screen reading and the fastest start.",
    action: info.isStandalone ? undefined : "install",
  });

  if (!allowed) {
    checks.push({
      id: "worker",
      label: "Offline storage active",
      status: "unavailable",
      detail:
        "Offline mode only runs on the live site at mybibleatlas.com — it is switched off inside the editor preview.",
    });
    checks.push({
      id: "shell",
      label: "App saved for offline start",
      status: "unavailable",
      detail: "Available on the live site only.",
    });
  } else {
    let active = false;
    try {
      const registration = await navigator.serviceWorker.getRegistration("/");
      active = Boolean(registration?.active);
    } catch {
      active = false;
    }
    checks.push({
      id: "worker",
      label: "Offline storage active",
      status: active ? "ready" : "missing",
      detail: active
        ? "Bible Atlas can now start without a connection."
        : "Offline storage isn't switched on yet for this device.",
      action: active ? undefined : "register",
    });

    const cached = await shellCached();
    checks.push({
      id: "shell",
      label: "App saved for offline start",
      status: cached ? "ready" : "missing",
      detail: cached
        ? "The app screen is stored on this device."
        : "Reload the page once while online so the app can save itself.",
      action: cached ? undefined : "register",
    });
  }

  let chapters = 0;
  try {
    chapters = (await storedChapterKeys()).length;
  } catch {
    chapters = 0;
  }
  checks.push({
    id: "bible",
    label: "Bible text downloaded",
    status: chapters > 0 ? "ready" : "missing",
    detail:
      chapters > 0
        ? `${chapters.toLocaleString()} chapters stored on this device.`
        : "No Scripture stored yet. Download the Bible to read with no connection.",
    action: chapters > 0 ? undefined : "download",
  });

  return checks;
}
