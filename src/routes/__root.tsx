import { useRouterState } from "@tanstack/react-router";
import { htmlLang, langFromPathname } from "@/lib/lang-routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SettingsProvider } from "../components/reader/settings";
import { HighlightProvider } from "../lib/highlights";
import { InstallPrompt } from "../components/reader/InstallPrompt";
import { AudioPlayer } from "../components/reader/AudioPlayer";
import { AudioBarProvider } from "../components/reader/audio-bar-context";
import { OfflineKjvPrompt } from "../components/reader/OfflineKjvPrompt";
import { registerOfflineWorker } from "../lib/pwa/register-sw";
import { watchInstallCompletion } from "../lib/pwa/install-signal";
import { checkForNewBuild, watchBuildVersion } from "../lib/pwa/version-check";
import { UpdatePrompt } from "../components/pwa/UpdatePrompt";
import { WrongOriginNotice } from "../components/install/WrongOriginNotice";
import { SITE_URL as SITE } from "@/lib/site";
import { AppSectionNav } from "@/components/AppSectionNav";
import { PromptCoordinator } from "@/components/pwa/PromptCoordinator";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const SITE_DESCRIPTION =
  "Read the Bible with interactive maps, timelines, family trees, 3D artefacts, and thematic connections next to the verse you're reading.";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { name: "theme-color", content: "#7a4a24" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Bible Atlas" },
      { name: "application-name", content: "Bible Atlas" },
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "author", content: "Bible Atlas" },
      { name: "google-site-verification", content: "5zFc9CUeGIl87IK0f080okITxxh2HJ3Y3UWKuGfGkJA" },
      { property: "og:site_name", content: "Bible Atlas" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:site", content: "@bibleatlas" },
      { name: "twitter:creator", content: "@bibleatlas" },
      { name: "twitter:image:alt", content: "Bible Atlas — read the Bible with context & maps" },
      { property: "og:image", content: `${SITE}/og/default-card.jpg` },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Bible Atlas — read the Bible with context & maps" },
      { name: "twitter:image", content: `${SITE}/og/default-card.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },

    ],
    scripts: [
      {
        // Applies the saved theme before the first paint so reloads never flash.
        children:
          "try{var s=JSON.parse(localStorage.getItem('bible-atlas:settings')||'null');" +
          "var d=s?s.theme==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;" +
          "document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}",
      },
      {
        type: "application/ld+json",

        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE}/#organization`,
              name: "Bible Atlas",
              url: SITE,
            },
            {
              "@type": "WebSite",
              "@id": `${SITE}/#website`,
              name: "Bible Atlas",
              url: SITE,
              description: SITE_DESCRIPTION,
              publisher: { "@id": `${SITE}/#organization` },
            },
          ],
        }),
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Instrument+Sans:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,500&family=Nunito+Sans:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  return (
    <html lang="en" {...(langFromPathname(pathname) ? { lang: htmlLang(langFromPathname(pathname)) } : {})} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    registerOfflineWorker();
    const stopVersionWatch = watchBuildVersion();
    const stopInstallWatch = watchInstallCompletion();
    return () => {
      stopVersionWatch();
      stopInstallWatch();
    };
  }, []);

  // A page change is a safe moment to swap to a newer build (throttled).
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  useEffect(() => {
    void checkForNewBuild();
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <HighlightProvider>
          <AudioBarProvider><PromptCoordinator>
            <AppSectionNav />
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <InstallPrompt />
            <UpdatePrompt />
            <WrongOriginNotice />
            <AudioPlayer />
            <OfflineKjvPrompt />
          </PromptCoordinator></AudioBarProvider>
        </HighlightProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

