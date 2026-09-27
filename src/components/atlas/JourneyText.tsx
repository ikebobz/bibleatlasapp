import { Link } from "@tanstack/react-router";
import { legDistances, versePath, type Journey, type JourneyLeg } from "@/lib/atlas/journeys";
import { legHeading, legPath, stopName, stopPlacePath } from "@/lib/atlas/journey-seo";
import { cn } from "@/lib/utils";

export type JourneyTextProps = {
  journey: Journey;
  leg?: JourneyLeg;
  activeStop?: number;
  onStopSelect?: (index: number) => void;
};

/**
 * Text companion under the interactive map: heading, summary and every stop
 * with its verse and place page, so the route is readable without the map.
 */
export function JourneyText({ journey, leg, activeStop, onStopSelect }: JourneyTextProps) {
  const legs = leg ? [leg] : journey.legs;
  const heading = leg && journey.legs.length > 1 ? `${legHeading(journey, leg)} Map` : `${journey.title} — Map & Route`;
  return (
    <article className="mx-auto max-w-3xl px-5 pb-[calc(var(--audio-bar-h,0px)+env(safe-area-inset-bottom,0px)+3rem)] pt-10">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/journeys" className="hover:text-foreground">Journeys</Link>
        {leg && journey.legs.length > 1 && (
          <>
            {" / "}
            <Link to="/journeys/$journey" params={{ journey: journey.id }} className="hover:text-foreground">
              {journey.title}
            </Link>
          </>
        )}
      </nav>
      <h1 className="scripture mt-2 text-2xl text-foreground sm:text-3xl">{heading}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {journey.description} <span className="whitespace-nowrap">({journey.era})</span>
      </p>
      <div className="mt-5 border-l-2 border-primary/40 pl-4">
        <p className="text-[10px] font-semibold uppercase text-primary">Why the geography matters</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground/85">{journey.context}</p>
        <p className="mt-2 text-xs text-muted-foreground">{journey.passage} · {journey.people.join(", ")}</p>
      </div>
      {journey.comparisonRoutes?.map((comparison) => (
        <section key={comparison.id} className="mt-6 border-y py-5" aria-labelledby={`${comparison.id}-heading`}>
          <p className="text-[10px] font-semibold uppercase text-primary">John 4:4 in geographic context</p>
          <h2 id={`${comparison.id}-heading`} className="scripture mt-1 text-lg text-foreground">The direct road and the eastern alternative</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            Jews and Samaritans carried deep religious and social tensions. The direct road north crossed Samaria; some travellers used a longer route through the Jordan Valley and Perea. Jesus went through Samaria, and John places his meeting at Jacob’s Well at the heart of the journey.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground"><span className="font-medium text-foreground">Interpretive note:</span> {comparison.note}</p>
        </section>
      ))}
      {!leg && journey.legs.length > 1 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {journey.legs.map((l) => (
            <li key={l.id}>
              <a href={legPath(journey, l)} className="inline-flex min-h-11 items-center rounded-full border px-4 text-sm text-foreground hover:bg-muted">
                {legHeading(journey, l)} · {l.short}
              </a>
            </li>
          ))}
        </ul>
      )}
      {legs.map((l) => {
        const dist = legDistances(l.stops, l.bySea);
        return (
          <section key={l.id} className="mt-8">
            {legs.length > 1 && (
              <h2 className="scripture text-xl text-foreground">
                <a href={legPath(journey, l)} className="hover:underline">{legHeading(journey, l)}</a>{" "}
                <span className="text-sm text-muted-foreground">({l.short})</span>
              </h2>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {l.stops.length} stops · about {Math.round(dist.at(-1) ?? 0).toLocaleString("en")} km along the drawn route
            </p>
            <ol className="mt-4 space-y-1 sm:space-y-2">
              {l.stops.map((s, i) => {
                const place = stopPlacePath(s);
                const verse = versePath(s.link);
                const isActive = activeStop === i;
                return (
                  <li
                    key={`${s.place}-${i}`}
                    className={cn(
                      "group flex cursor-pointer gap-3 rounded-lg p-2 transition-colors sm:p-3",
                      isActive ? "bg-primary/10 shadow-sm ring-1 ring-primary/20" : "hover:bg-muted/50"
                    )}
                    onClick={() => onStopSelect?.(i)}
                  >
                    <span className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {place ? <a href={place} className="underline-offset-2 hover:underline" onClick={(e) => e.stopPropagation()}>{stopName(s)}</a> : stopName(s)}
                        {s.ref && (
                          <>
                            {" · "}
                            {verse ? <a href={verse} className="text-muted-foreground underline-offset-2 hover:underline" onClick={(e) => e.stopPropagation()}>{s.ref}</a> : s.ref}
                          </>
                        )}
                        {i > 0 && <span className="text-muted-foreground"> · {Math.round(dist[i]).toLocaleString("en")} km</span>}
                      </p>
                      {s.when && <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">{s.when}</p>}
                      <p className={cn(
                        "mt-1 text-xs leading-relaxed",
                        isActive ? "text-foreground/90" : "text-muted-foreground"
                      )}>{s.note}{s.extra ? ` (${s.extra})` : ""}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      {journey.unlocatedStops && journey.unlocatedStops.length > 0 && (
        <details className="mt-10 border-t pt-6">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-foreground">
            Additional recorded stations without secure map locations ({journey.unlocatedStops.length})
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">These places remain part of the biblical itinerary, but assigning precise coordinates would overstate the evidence.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {journey.unlocatedStops.map((stop) => <li key={`${stop.name}-${stop.ref}`} className="border-l pl-3 text-xs"><span className="font-medium text-foreground">{stop.name}</span><span className="text-muted-foreground"> · {stop.ref}</span></li>)}
          </ul>
        </details>
      )}
    </article>
  );
}
