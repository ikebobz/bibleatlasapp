import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { detectPlatform } from "@/lib/pwa/platform";
import { runReadinessChecks, type ReadinessCheck } from "@/lib/pwa/readiness";
import { installCompletedRecorded } from "@/lib/pwa/install-signal";

const TITLE = "Install QA checklist";
const DESCRIPTION = "Internal step-by-step script for testing the Bible Atlas install, update and offline flows.";

export const Route = createFileRoute("/install/qa")({
  component: QaPage,
  head: () => ({
    meta: [
      { title: `${TITLE} — Bible Atlas` },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://mybibleatlas.com/install/qa" },
    ],
    links: [{ rel: "canonical", href: "https://mybibleatlas.com/install/qa" }],
  }),
});

type Section = { title: string; steps: { do: string; expect: string; note?: string }[] };

const SECTIONS: Section[] = [
  {
    title: "iPhone — Safari (iOS 17 and iOS 18)",
    steps: [
      {
        do: "Delete any existing Home Screen icon, then in Settings → Safari → Advanced → Website Data remove mybibleatlas.com.",
        expect: "A clean first-visit state.",
      },
      {
        do: "Open https://mybibleatlas.com in Safari and read for about 45 seconds (or reload once for a second visit).",
        expect: "The install banner appears above the audio bar with a tappable “Show me how” button.",
        note: "If nothing appears, check localStorage for bible-atlas:install-never or :install-dismissed-until.",
      },
      { do: "Tap “Show me how”.", expect: "The guide sheet opens showing Share → Add to Home Screen → Add." },
      {
        do: "Tap the Share icon in the Safari bottom toolbar, scroll the grey action list, tap “Add to Home Screen”, then “Add”.",
        expect: "The Bible Atlas icon appears on the Home Screen with the correct artwork (not a blank page thumbnail).",
        note: "iOS 18 puts “Add to Home Screen” lower in the list than iOS 17.",
      },
      {
        do: "Launch the app from the Home Screen icon.",
        expect: "Full-screen, no Safari chrome, no install banner, and the install_completed signal fires exactly once (see diagnostics below).",
      },
      { do: "Force-quit and relaunch the app.", expect: "Still no banner, and install_completed does NOT fire again." },
    ],
  },
  {
    title: "iPad — Safari",
    steps: [
      { do: "Repeat the iPhone steps.", expect: "Same behaviour, but the Share icon sits in the top toolbar, and the guide says so." },
    ],
  },
  {
    title: "In-app browsers (Instagram, Facebook, Gmail, X)",
    steps: [
      {
        do: "Post a mybibleatlas.com link into the app and tap it.",
        expect: "The banner reads “Open in your browser to install”, not the Safari steps.",
      },
      {
        do: "Use the app’s “…” menu → Open in Safari, then install as above.",
        expect: "The normal iOS flow works from Safari.",
      },
    ],
  },
  {
    title: "Android Chrome and desktop Chrome/Edge",
    steps: [
      { do: "Open the site and wait for the banner.", expect: "A real “Install” button that opens the native browser prompt." },
      { do: "Accept the prompt.", expect: "App installs, banner disappears, install_completed fires once." },
    ],
  },
  {
    title: "Update flow",
    steps: [
      { do: "With the app open, publish a new version and leave the app in the foreground (or reopen it).", expect: "Within an hour, or on the next return to the tab, the “A new version of Bible Atlas is ready” toast appears." },
      { do: "Tap “Later” and keep reading.", expect: "Nothing reloads; reading is uninterrupted." },
      { do: "Tap “Refresh now”.", expect: "One reload, the new version loads, and previously downloaded chapters are still available." },
      { do: "Start a Bible download, then trigger an update.", expect: "The toast stays hidden while the download runs." },
    ],
  },
  {
    title: "Offline",
    steps: [
      { do: "On /install, run the offline readiness checklist.", expect: "Every row is green after enabling offline and downloading the Bible." },
      { do: "Turn on airplane mode and cold-launch the app from the Home Screen.", expect: "The app opens and a downloaded chapter reads normally." },
    ],
  },
];

function QaPage() {
  const [diag, setDiag] = useState<string>("collecting…");

  const collect = useCallback(async () => {
    const info = detectPlatform();
    let checks: ReadinessCheck[] = [];
    try {
      checks = await runReadinessChecks();
    } catch {
      /* ignore */
    }
    let controller = "none";
    try {
      controller = navigator.serviceWorker?.controller ? "controlled" : "uncontrolled";
    } catch {
      /* ignore */
    }
    setDiag(
      [
        `platform: ${info.kind}`,
        `browser: ${info.browser}`,
        `iOS Safari: ${info.isIosSafari}`,
        `in-app browser: ${info.isInAppBrowser}`,
        `standalone: ${info.isStandalone}`,
        `install_completed recorded: ${installCompletedRecorded()}`,
        `service worker: ${controller}`,
        ...checks.map((c) => `${c.id}: ${c.status}`),
        `url: ${window.location.href}`,
        `ua: ${navigator.userAgent}`,
      ].join("\n"),
    );
  }, []);

  useEffect(() => {
    void collect();
  }, [collect]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/install" className="text-xs text-muted-foreground underline underline-offset-2">
        ← Back to install help
      </Link>

      <h1 className="mt-4 font-serif text-2xl text-foreground">Install QA checklist</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Work top to bottom on a real device. Paste the diagnostics block into any bug report.
      </p>

      <section className="mt-6 rounded-xl border bg-surface-raised p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">This device</h2>
          <button
            type="button"
            onClick={() => void collect()}
            className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
          >
            Refresh
          </button>
        </div>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
          {diag}
        </pre>
      </section>

      {SECTIONS.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
          <ol className="mt-3 space-y-3">
            {section.steps.map((step, i) => (
              <li key={step.do} className="rounded-xl border p-4">
                <p className="text-sm text-foreground">
                  <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                  {step.do}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Expected:</span> {step.expect}
                </p>
                {step.note && <p className="mt-1 text-xs text-muted-foreground">Note: {step.note}</p>}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
