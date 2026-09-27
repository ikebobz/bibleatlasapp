import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
  BookOpen,
  Sparkles,
  Map,
  Network,
  Box,
  Scale,
  Search,
  Languages,
  BookType,
  CloudOff,
  Highlighter,
  Bell,
  Stethoscope,
  Settings,
  Waypoints,
  Headphones,
} from "lucide-react";
import { RELEASES, compareVersions, type Release, type ReleaseIcon } from "@/lib/release-notes";
import { useWhatsNew } from "@/lib/whats-new";
import { trackWhatsNew } from "@/lib/analytics/whats-new-events";
import { SITE_URL as SITE } from "@/lib/site";

export const Route = createFileRoute("/whats-new")({
  head: () => {
    const title = "What's new — Bible Atlas";
    const description =
      "Release notes for Bible Atlas: every feature added since launch, newest first, with anything new since your last visit grouped at the top.";
    const url = `${SITE}/whats-new`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: WhatsNewPage,
});

const ICONS: Record<ReleaseIcon, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  sparkles: Sparkles,
  map: Map,
  network: Network,
  box: Box,
  scale: Scale,
  search: Search,
  languages: Languages,
  bookType: BookType,
  cloudOff: CloudOff,
  highlighter: Highlighter,
  bell: Bell,
  stethoscope: Stethoscope,
  settings: Settings,
  waypoints: Waypoints,
  headphones: Headphones,
};

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function ReleaseCard({ release }: { release: Release }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-sm font-semibold text-foreground">
          v{release.version} — {release.title}
        </h2>
        <time
          dateTime={release.date}
          className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70"
        >
          {formatDate(release.date)}
        </time>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">{release.summary}</p>

      <ul className="mt-3 space-y-3">
        {release.items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li
              key={item.title}
              className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 rounded-full border bg-background p-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  {item.link && (
                    <Link
                      to={item.link.to}
                      className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      {item.link.label} →
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function WhatsNewPage() {
  const { ready, lastSeen, unseenCount, isFirstVisit, markSeen } = useWhatsNew();
  // Freeze the version this visit arrived with: marking the notes as read must
  // not make the "new since your last visit" grouping vanish mid-view.
  const entry = useRef<{ lastSeen: string | null; count: number; first: boolean } | null>(null);
  if (ready && !entry.current) {
    entry.current = { lastSeen, count: unseenCount, first: isFirstVisit };
  }

  // Opening the page counts as reading the notes.
  const logged = useRef(false);
  useEffect(() => {
    if (!ready) return;
    if (!logged.current) {
      logged.current = true;
      trackWhatsNew("page_view", { lastSeen, unseenCount });
    }
    markSeen();
  }, [ready, markSeen, lastSeen, unseenCount]);

  const snapshot = entry.current;
  const showDivider = !!snapshot && !snapshot.first && snapshot.count > 0 && snapshot.lastSeen !== null;
  const isNew = (release: Release) =>
    showDivider &&
    snapshot!.lastSeen !== null &&
    compareVersions(release.version, snapshot!.lastSeen) > 0;


  const fresh = RELEASES.filter(isNew);
  const older = RELEASES.filter((r) => !isNew(r));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 px-4 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight">Bible Atlas</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24 pt-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="scripture text-3xl text-foreground">What's new</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Release notes for Bible Atlas, newest first. Each version lists what changed, so returning
          readers can catch up on everything added since their last visit.
        </p>

        {showDivider && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                New since your last visit
              </span>
              <span className="text-[11px] text-muted-foreground">
                {snapshot?.count ?? 0} update{snapshot?.count === 1 ? "" : "s"}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            {fresh.map((release) => (
              <ReleaseCard key={release.version} release={release} />
            ))}
          </div>
        )}

        <div className="mt-10 space-y-10">
          {showDivider && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                Earlier releases
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          )}
          {older.map((release) => (
            <ReleaseCard key={release.version} release={release} />
          ))}
        </div>

        <div className="mt-12 rounded-xl border bg-muted/30 p-5">
          <h2 className="text-sm font-semibold text-foreground">How to find these features</h2>
          <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
            <li className="flex items-start gap-2">
              <Headphones className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                The <strong>audio player</strong> appears at the bottom of the screen when you read a New Testament chapter. Tap play to listen, or toggle Autoplay to move through chapters automatically.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Settings className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                Tap the <strong>settings gear</strong> in the top-right corner for text options,
                offline saving, daily verse notifications, highlights and connections.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Map className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                <strong>Tap highlighted words</strong> while reading to open maps, artifacts,
                measurements, original-language cards and thematic threads.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Waypoints className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>
                Visit <Link to="/connections" className="text-primary hover:underline">Connections</Link>{" "}
                and <Link to="/highlights" className="text-primary hover:underline">Highlights</Link>{" "}
                from the settings menu for full-screen exploration.
              </span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
