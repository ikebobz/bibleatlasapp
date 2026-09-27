// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { assertCanonicalDomain } from "./scripts/check-domain";

// Server routes (email sending, webhooks) read unprefixed secrets from
// process.env. Vite only loads VITE_* by default, so populate the rest here.
// These are never added to the client define block.
Object.assign(process.env, loadEnv(process.env["NODE_ENV"] ?? "development", process.cwd(), ""));

/** Unique per build so the precached app shell is invalidated on every deploy. */
const BUILD_ID = `bible-atlas-shell-${Date.now().toString(36)}`;


export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    // Stamped into both the client bundle and the server build so a running
    // app can compare itself against the build the site is currently serving.
    define: {
      __BUILD_ID__: JSON.stringify(BUILD_ID),
    },
    resolve: {
      // React Email pulls in `entities`; a nested v7 copy breaks SSR because it
      // dropped ./lib/decode.js. Pin every import to the hoisted v4.5.0 copy.
      alias: {
        "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
        "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
        entities: path.resolve(__dirname, "node_modules/entities"),
      },
    },
    plugins: [
      {
        // Fails the build if any canonical URL, sitemap entry, robots.txt line,
        // og:url or structured-data URL drifts off the production domain.
        name: "bible-atlas-domain-guard",
        apply: "build" as const,
        buildStart() {
          assertCanonicalDomain();
        },
      },
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        devOptions: { enabled: false },
        manifest: false,
        workbox: {
          // Web push + notification click handling lives in this hand-written
          // messaging script; caching stays owned by the generated worker.
          importScripts: ["/push-sw.js"],
          globPatterns: ["**/*.{js,css,ico,png,svg,woff2}"],
           // TanStack's client output is emitted under `client/`, but the
           // published server exposes those files from the site root. Workbox
           // otherwise precaches `/client/...` URLs that 404 and the browser
           // discards the entire worker during installation.
           manifestTransforms: [
             async (entries) => ({
               manifest: entries.map((entry) => ({
                 ...entry,
                 url: entry.url.replace(/^client\//, ""),
               })),
               warnings: [],
             }),
           ],
           // Navigation fallback must itself be precached. The revision must
           // change on every build, otherwise Workbox keeps replaying the old
           // shell HTML (pointing at stale bundles) on returning devices.
           additionalManifestEntries: [{ url: "/", revision: BUILD_ID }],
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /^\/_serverFn\//, /^\/sitemap\.xml$/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          // The user decides when to switch versions; the UpdatePrompt messages
          // SKIP_WAITING so a refresh never interrupts reading mid-chapter.
          skipWaiting: false,
          runtimeCaching: [
            {
              // Real-geography map tiles, styles, sprites and glyphs. Cached
              // first so a saved atlas renders with no network; ignoreSearch
              // matches the per-session token the map appends to each request.
              urlPattern: ({ url }: { url: URL }) =>
                url.hostname.endsWith("mapbox.com") && !url.pathname.startsWith("/events"),
              handler: "CacheFirst",
              options: {
                cacheName: "atlas-map-tiles",
                matchOptions: { ignoreSearch: true },
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 120 },
              },
            },
            {

              // HTML navigations: always try the network first so readers get fresh pages.
              urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: {
                cacheName: "atlas-pages",
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
                // Offline, a page the reader has never opened has no cached
                // copy; without this the browser shows its own error page and
                // the downloaded Bible sitting in storage is never reached.
                // The precached shell boots the app, which then reads locally.
                precacheFallback: { fallbackURL: "/" },
              },
            },
            {
              // Hashed build assets are immutable.
               urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
                 sameOrigin && url.pathname.startsWith("/assets/"),
              handler: "CacheFirst",
              options: {
                cacheName: "atlas-assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: ({ url }: { url: URL }) =>
                url.origin === "https://fonts.googleapis.com" ||
                url.origin === "https://fonts.gstatic.com",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "atlas-fonts", expiration: { maxEntries: 30 } },
            },
          ],
        },
      }),
    ],
  },
});
