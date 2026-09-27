/** Person / Place JSON-LD for the entity silo pages. */

import { SITE_URL } from "@/lib/site";
import type { Entity } from "./registry";
import { entityPath } from "./registry";
import type { CuratedPerson, CuratedPlace } from "./copy";

const WEBSITE_ID = `${SITE_URL}/#website`;
const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function entityUrl(entity: Entity): string {
  return `${SITE_URL}${entityPath(entity)}`;
}

export function entityStructuredData(opts: {
  entity: Entity;
  title: string;
  description: string;
  /** A handful of verse references to cite as sources. */
  citations?: { reference: string; url: string }[];
}) {
  const { entity, title, description } = opts;
  const url = entityUrl(entity);
  const hubName = entity.type === "person" ? "People in the Bible" : "Places in the Bible";
  const hubUrl = entity.type === "person" ? `${SITE_URL}/people` : `${SITE_URL}/places`;
  const curated = entity.curated;

  const main =
    entity.type === "person"
      ? {
          "@type": "Person",
          "@id": `${url}#person`,
          name: entity.name,
          description,
          url,
          ...(entity.aliases.length ? { alternateName: entity.aliases } : {}),
          ...((curated as CuratedPerson | null)?.role
            ? { disambiguatingDescription: (curated as CuratedPerson).role }
            : {}),
        }
      : {
          "@type": "Place",
          "@id": `${url}#place`,
          name: entity.name,
          description,
          url,
          ...(entity.aliases.length ? { alternateName: entity.aliases } : {}),
          ...((curated as CuratedPlace | null)?.modern
            ? {
                address: {
                  "@type": "PostalAddress",
                  addressLocality: (curated as CuratedPlace).modern,
                },
              }
            : {}),
          ...(entity.geo
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: entity.geo.lat,
                  longitude: entity.geo.lon,
                },
              }
            : {}),
        };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: "en",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": main["@id"] },
        publisher: { "@id": ORGANIZATION_ID },
        isAccessibleForFree: true,
        ...(opts.citations?.length
          ? {
              citation: opts.citations.slice(0, 10).map((c) => ({
                "@type": "CreativeWork",
                name: c.reference,
                url: c.url,
              })),
            }
          : {}),
      },
      main,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Bible Atlas", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: hubName, item: hubUrl },
          { "@type": "ListItem", position: 3, name: entity.name, item: url },
        ],
      },
    ],
  };
}

export function entityHubStructuredData(opts: {
  type: "person" | "place";
  title: string;
  description: string;
  items: { name: string; url: string }[];
}) {
  const hubUrl = opts.type === "person" ? `${SITE_URL}/people` : `${SITE_URL}/places`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${hubUrl}#webpage`,
        url: hubUrl,
        name: opts.title,
        description: opts.description,
        inLanguage: "en",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORGANIZATION_ID },
        isAccessibleForFree: true,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: opts.items.length,
          itemListElement: opts.items.map((item, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: item.name,
            url: item.url,
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Bible Atlas", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: opts.title, item: hubUrl },
        ],
      },
    ],
  };
}
