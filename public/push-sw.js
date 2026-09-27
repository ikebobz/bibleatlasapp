/*
 * Bible Atlas messaging service worker additions.
 *
 * This file is imported by the generated Workbox service worker (see
 * vite.config.ts -> workbox.importScripts). It only handles web push and
 * notification clicks; caching is owned entirely by the generated worker.
 *
 * Pushes are sent without a payload. When one arrives the worker asks the
 * server for today's verse, so the notification always shows fresh text and
 * no scripture ever travels through the push service.
 */

const PUSH_PREFS_CACHE = "bible-atlas-push-prefs";
const PUSH_PREFS_URL = "/__push-prefs";
const LEGACY_PAGE_CACHES = new Set(["atlas-pages"]);

// Remove only the old HTML/page cache when this worker activates. Scripture
// downloads, push preferences, highlights, and browser settings are separate
// stores and remain untouched.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.allSettled(
        names.filter((name) => LEGACY_PAGE_CACHES.has(name)).map((name) => caches.delete(name)),
      );
    })(),
  );
});

async function readTranslation() {
  try {
    const cache = await caches.open(PUSH_PREFS_CACHE);
    const hit = await cache.match(PUSH_PREFS_URL);
    if (!hit) return "kjv";
    const prefs = await hit.json();
    return typeof prefs.translation === "string" ? prefs.translation : "kjv";
  } catch {
    return "kjv";
  }
}

async function showDailyVerse() {
  const translation = await readTranslation();
  let data = null;

  try {
    const res = await fetch(`/api/public/push/today?v=${encodeURIComponent(translation)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) data = await res.json();
  } catch {
    /* fall through to the generic notification below */
  }

  const title = data?.title || "Today's verse";
  const body = data
    ? `${data.reference}\n${data.text || ""}`.trim()
    : "Open Bible Atlas to read today's verse.";

  await self.registration.showNotification(title, {
    body,
    tag: "bible-atlas-daily",
    renotify: true,
    icon: "/app-icon-192.png",
    badge: "/app-icon-192.png",
    data: {
      url: data?.path || "/",
      sourceUrl: data?.sourceUrl || null,
    },
    actions: data?.sourceUrl
      ? [
          { action: "read", title: "Read the passage" },
          { action: "devotional", title: "Read the devotional" },
        ]
      : [{ action: "read", title: "Read the passage" }],
  });
}

self.addEventListener("push", (event) => {
  event.waitUntil(showDailyVerse());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target =
    event.action === "devotional" && data.sourceUrl
      ? data.sourceUrl
      : new URL(data.url || "/", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && target.startsWith(self.location.origin)) {
          await client.focus();
          await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
