import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, MapPin, Route, Users } from "lucide-react";
import { JourneyPreview } from "./JourneyPreview";
import { JOURNEYS, totalDistanceKm, type Journey, type JourneyCategory } from "@/lib/atlas/journeys";
import { PLACES } from "@/lib/atlas/geo";

const CATEGORY_ORDER: JourneyCategory[] = ["Patriarchs", "Exodus & Israel", "Jesus", "Early Church", "Prophets & Kings"];

function endpoints(journey: Journey) {
  const stops = journey.legs[0].stops;
  const first = stops[0];
  const last = stops.at(-1);
  return [first?.label ?? (first ? PLACES[first.place]?.name : undefined), last?.label ?? (last ? PLACES[last.place]?.name : undefined)];
}

function JourneyCard({ journey, featured = false }: { journey: Journey; featured?: boolean }) {
  const [start, end] = endpoints(journey);
  const stops = journey.legs.reduce((sum, leg) => sum + leg.stops.length, 0);
  const km = journey.legs.reduce((sum, leg) => sum + totalDistanceKm(leg.stops, leg.bySea), 0);
  return (
    <article className={`group overflow-hidden border bg-card transition-shadow hover:shadow-lg ${featured ? "min-w-[82vw] sm:min-w-[30rem] lg:min-w-0" : ""}`}>
      <Link to="/journeys/$journey" params={{ journey: journey.id }} search={{}} className="block" aria-label={`Follow ${journey.title}`}>
        <div className={featured ? "aspect-[16/9] border-b" : "aspect-[16/8] border-b"}>
          <JourneyPreview stops={journey.legs[0].stops} />
        </div>
        <div className={featured ? "p-5 sm:p-6" : "p-4"}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase text-primary">{journey.category}</p>
            <span className="text-[11px] text-muted-foreground">{journey.era}</span>
          </div>
          <h3 className={`scripture mt-2 text-foreground ${featured ? "text-2xl" : "text-xl"}`}>{journey.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{journey.tagline}</p>
          <dl className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5" aria-hidden /><span>{journey.passage}</span></div>
            <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" aria-hidden /><span>{start} → {end}</span></div>
            <div className="flex items-center gap-2"><Route className="h-3.5 w-3.5" aria-hidden /><span>{stops} major stops · approx. {Math.round(km).toLocaleString()} km</span></div>
            <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5" aria-hidden /><span>{journey.people.slice(0, 3).join(", ")}</span></div>
          </dl>
          <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground">Follow journey <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
        </div>
      </Link>
    </article>
  );
}

export function JourneyLibrary() {
  const featured = JOURNEYS.filter((journey) => journey.featured);
  return (
    <div className="bg-background">
      <header className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-5 sm:pt-16">
        <p className="text-xs font-semibold uppercase text-primary">Journeys through Scripture</p>
        <h1 className="scripture mt-3 max-w-3xl text-4xl leading-tight text-foreground sm:text-5xl">Follow the movement of the biblical story</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">Explore eleven journeys through real geography, ordered events and the passages behind every stop.</p>
      </header>

      <section aria-labelledby="featured-journeys" className="border-y bg-muted/30 py-9">
        <div className="mx-auto max-w-7xl px-4 sm:px-5">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase text-primary">Start here</p><h2 id="featured-journeys" className="scripture mt-1 text-2xl text-foreground">Featured journeys</h2></div>
            <span className="hidden text-xs text-muted-foreground sm:block">Map, story and Scripture in one view</span>
          </div>
          <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {featured.map((journey) => <div key={journey.id} className="snap-start"><JourneyCard journey={journey} featured /></div>)}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-5">
        {CATEGORY_ORDER.map((category) => {
          const journeys = JOURNEYS.filter((journey) => journey.category === category);
          if (!journeys.length) return null;
          return (
            <section key={category} aria-labelledby={`category-${category.replace(/\W+/g, "-").toLowerCase()}`}>
              <div className="flex items-baseline justify-between border-b pb-3"><h2 id={`category-${category.replace(/\W+/g, "-").toLowerCase()}`} className="scripture text-2xl text-foreground">{category}</h2><span className="text-xs text-muted-foreground">{journeys.length} {journeys.length === 1 ? "journey" : "journeys"}</span></div>
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{journeys.map((journey) => <JourneyCard key={journey.id} journey={journey} />)}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}