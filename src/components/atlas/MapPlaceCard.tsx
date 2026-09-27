import { Network } from 'lucide-react';
import { NODE_BY_ENTRY } from '@/lib/threads/graph';
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, MapPin, Navigation, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAP_FEATURE_BY_ID,
  MAP_JOURNEY_BY_ID,
  certaintyLabel,
  isApproximate,
  nearbyFeatures,
} from "@/lib/atlas/catalogue";

export function MapPlaceCard({ placeId, onSelect }: { placeId: string; onSelect?: (placeId: string) => void }) {
  const feature = MAP_FEATURE_BY_ID[placeId];
  if (!feature) return null;
  const nearby = nearbyFeatures(placeId, 4);
  const passage = feature.passages[0];

  return (
    <article className="bg-surface-raised p-3.5 sm:p-5" aria-label={`${feature.name} map context`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-primary">
            <MapPin className="h-3 w-3" aria-hidden /> {feature.kind}
          </p>
          <h2 className="scripture mt-1 text-xl text-foreground sm:text-2xl">{feature.name}</h2>
          {(feature.modernName || feature.region) && (
            <p className="mt-1 text-xs text-muted-foreground">{feature.modernName ?? feature.region}</p>
          )}
        </div>
        <span className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground">
          {certaintyLabel(feature.certainty)}
        </span>
      </div>

      {feature.summary ? (
        <p className="mt-2.5 text-sm leading-relaxed text-foreground/90 sm:mt-3">{feature.summary}</p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Explore this location in relation to its biblical journeys and nearby places.
        </p>
      )}

      {isApproximate(feature.certainty) && (
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Approximate location</p>
      )}
      {feature.certaintyNote && (
        <p className="mt-3 flex gap-2 rounded-md bg-muted p-2.5 text-xs leading-relaxed text-muted-foreground">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {feature.certaintyNote}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        
        {NODE_BY_ENTRY[placeId] && (
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to="/connections/$node" params={{ node: NODE_BY_ENTRY[placeId].id }} search={{ from: `/maps` }}>
              <Network className="h-3.5 w-3.5" /> Connections
            </Link>
          </Button>
        )}
{feature.entitySlug && (
          <Button asChild size="sm">
            <Link to="/places/$slug" params={{ slug: feature.entitySlug }} search={{}}>
              Explore place <ArrowRight aria-hidden />
            </Link>
          </Button>
        )}
        {passage && (
          <Button asChild size="sm" variant="outline">
            <Link
              to={passage.verse ? "/$book/$chapter/$verse" : "/$book/$chapter"}
              params={passage.verse
                ? { book: passage.book, chapter: String(passage.chapter), verse: String(passage.verse) }
                : { book: passage.book, chapter: String(passage.chapter) }}
            >
              <BookOpen aria-hidden /> {passage.reference}
            </Link>
          </Button>
        )}
      </div>

      {feature.journeyIds.length > 0 && (
        <section className="mt-4 border-t pt-3 sm:mt-5 sm:pt-4">
          <h3 className="text-[10px] font-semibold uppercase text-muted-foreground">Journeys through here</h3>
          <div className="mt-2 space-y-1">
            {feature.journeyIds.slice(0, 3).map((journeyId) => {
              const journey = MAP_JOURNEY_BY_ID[journeyId];
              return journey ? (
                <Link key={journeyId} to="/journeys/$journey" params={{ journey: journeyId }} search={{}} className="flex min-h-11 items-center justify-between rounded-md px-2 text-xs hover:bg-muted">
                  {journey.title}<ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : null;
            })}
          </div>
        </section>
      )}

      {nearby.length > 0 && onSelect && (
        <section className="mt-4 border-t pt-4">
          <h3 className="text-[10px] font-semibold uppercase text-muted-foreground">Nearby on the map</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {nearby.map((near) => (
              <Button key={near.id} type="button" variant="outline" size="sm" onClick={() => onSelect(near.id)}>
                <Navigation aria-hidden /> {near.name} · {Math.round(near.distanceKm)} km
              </Button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}