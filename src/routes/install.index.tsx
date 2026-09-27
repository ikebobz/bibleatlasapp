import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { InstallSteps, type GuideVariant, variantForPlatform } from "@/components/install/InstallGuide";
import { detectPlatform } from "@/lib/pwa/platform";
import { trackShare } from "@/lib/analytics/share-events";
import { OfflineReadiness } from "@/components/install/OfflineReadiness";
import { OriginCard } from "@/components/install/OriginCard";
import { BuildFreshness } from "@/components/install/BuildFreshness";

const TITLE = "Install Bible Atlas on your phone or computer";
const DESCRIPTION =
  "Step-by-step instructions for adding Bible Atlas to your iPhone or iPad Home Screen, installing it on Android, or adding it to your desktop.";
const URL = "https://mybibleatlas.com/install";

export const Route = createFileRoute("/install/")({
  component: InstallPage,
  head: () => ({
    meta: [
      { title: `${TITLE} — Bible Atlas` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
});

const TABS: { id: GuideVariant; label: string }[] = [
  { id: "iphone", label: "iPhone" },
  { id: "ipad", label: "iPad" },
  { id: "android", label: "Android" },
  { id: "desktop", label: "Desktop" },
];

const FAQ = [
  {
    q: "I don't see “Add to Home Screen” in the list",
    a: "That option only exists in Safari on iPhone and iPad. If you opened Bible Atlas from Instagram, Facebook, Gmail or another app, tap the “…” menu in that app and choose “Open in Safari” first. Also check you scrolled far enough down the grey list of actions in the Share sheet.",
  },
  {
    q: "The icon on my Home Screen looks blank",
    a: "Delete the shortcut and add it again from mybibleatlas.com. Adding it from an old bookmark or a redirecting link can skip the app icon.",
  },
  {
    q: "How do I read offline?",
    a: "Once installed, open Bible Atlas and use the offline download prompt to store the KJV on your device. It then opens and reads with no connection at all.",
  },
  {
    q: "Does installing cost anything or need an account?",
    a: "No. Bible Atlas is free, needs no account and installs straight from the browser — nothing goes through the App Store or Play Store.",
  },
];

function InstallPage() {
  const [tab, setTab] = useState<GuideVariant>("iphone");
  const [installed, setInstalled] = useState(false);
  const [offCanonical, setOffCanonical] = useState(false);

  useEffect(() => {
    const info = detectPlatform();
    setInstalled(info.isStandalone);
    const detected = variantForPlatform(info.kind, false);
    if (detected !== "inapp") setTab(detected);
    trackShare("install_instructions_viewed", { resourceType: "chapter", resourceRef: `page/${info.kind}` });
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/" className="text-xs text-muted-foreground underline underline-offset-2">
        ← Back to the Bible reader
      </Link>

      <header className="mt-4 flex items-start gap-4">
        <img
          src="/apple-touch-icon.png"
          alt="Bible Atlas app icon"
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-2xl border"
        />
        <div>
          <h1 className="font-serif text-2xl text-foreground">Install Bible Atlas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add Bible Atlas to your Home Screen for full-screen reading, faster opening and offline Scripture. It's
            free and takes about ten seconds.
          </p>
        </div>
      </header>

      {installed && !offCanonical && (
        <p className="mt-6 rounded-xl border bg-surface-raised p-4 text-sm text-foreground">
          You're already using the installed app. Nothing more to do.
        </p>
      )}

      <OriginCard onStatus={setOffCanonical} />

      <div
        className={`mt-8 ${offCanonical ? "opacity-60" : ""}`}
        id="steps"
        role="tablist"
        aria-label="Choose your device"
      >
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                tab === t.id
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <section
        className={`mt-6 rounded-xl border bg-surface-raised p-5 ${offCanonical ? "opacity-60" : ""}`}
        role="tabpanel"
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          {TABS.find((t) => t.id === tab)?.label} instructions
        </h2>
        <InstallSteps variant={tab} />
      </section>

      <BuildFreshness />

      <div className="mt-8">
        <OfflineReadiness />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Install questions</h2>
        <dl className="mt-4 space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-xl border p-4">
              <dt className="text-sm font-medium text-foreground">{item.q}</dt>
              <dd className="mt-1.5 text-sm text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        <Link to="/install/qa" className="underline underline-offset-2">
          Testing checklist
        </Link>{" "}
        — step-by-step device QA script.
      </p>
    </main>
  );
}
