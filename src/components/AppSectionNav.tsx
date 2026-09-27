import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, BookText, CalendarClock, Landmark, Map as MapIcon, Users, Waypoints } from "lucide-react";

const links = [
  { to: "/journeys" as const, label: "Journeys", icon: MapIcon },
  { to: "/timeline" as const, label: "Timeline", icon: CalendarClock },
  { to: "/concordance" as const, label: "Concordance", icon: BookText },
  { to: "/people" as const, label: "People", icon: Users },
  { to: "/places" as const, label: "Places", icon: Landmark },
  { to: "/connections" as const, label: "Connections", icon: Waypoints },
];

/** Shared navigation for content hubs; immersive maps and the reader keep their own chrome. */
export function AppSectionNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isReader = /^\/[a-z0-9-]+\/\d+(?:\/\d+)?\/?$/.test(pathname);
  const hidden = pathname === "/" || isReader || pathname.startsWith("/journeys/") || pathname.startsWith("/maps") || pathname.startsWith("/connections") || pathname.startsWith("/admin") || pathname.startsWith("/api/");
  if (hidden) return null;

  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
      <nav aria-label="Main navigation" className="mx-auto flex h-14 max-w-7xl items-center gap-2 overflow-x-auto px-4 sm:px-5">
        <Link to="/" aria-label="Bible Atlas — back to reading" className="mr-1 flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-foreground">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden />
          <span className="hidden sm:inline">Bible Atlas</span>
          <span className="sm:hidden">Read</span>
        </Link>
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
            activeProps={{ className: "bg-muted text-foreground" }}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs transition-colors"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}