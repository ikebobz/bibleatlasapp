import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { TreeNode } from "@/lib/atlas/types";
import { entityBySlug, type Entity } from "@/lib/entities/registry";
import { familyTreeFor, findInTree, nodePersonPath, type FamilyTree } from "@/lib/entities/family-trees";
import { SITE_URL as SITE } from "@/lib/site";

export const Route = createFileRoute("/people/$slug_/family-tree")({
  loader: ({ params }) => {
    const entity = entityBySlug("person", params.slug);
    const tree = entity ? familyTreeFor(entity.slug) : undefined;
    if (!entity || !tree) throw notFound();
    return { entity, tree };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found — Bible Atlas" }, { name: "robots", content: "noindex" }] };
    }
    const { entity, tree } = loaderData;
    const url = `${SITE}/people/${entity.slug}/family-tree`;
    const title = `${entity.name}'s Family Tree in the Bible | Bible Atlas`;
    const names = flatten(tree.root).map((n) => n.name);
    const description = `${entity.name}'s family in Scripture: ${names.slice(0, 8).join(", ")}${names.length > 8 ? " and more" : ""}. ${tree.caption ?? ""}`.trim().slice(0, 158);
    const hit = findInTree(tree.root, entity.name);
    const person = (n: TreeNode) => {
      const path = nodePersonPath(n);
      return { "@type": "Person", name: n.name, ...(path ? { url: `${SITE}${path}` } : {}) };
    };
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Person",
                name: entity.name,
                url: `${SITE}/people/${entity.slug}`,
                ...(hit?.parent ? { parent: person(hit.parent) } : {}),
                ...(hit?.node.children?.length ? { children: hit.node.children.map(person) } : {}),
                subjectOf: { "@type": "WebPage", url, name: title },
              },
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Bible Atlas", item: SITE },
                  { "@type": "ListItem", position: 2, name: "People", item: `${SITE}/people` },
                  { "@type": "ListItem", position: 3, name: entity.name, item: `${SITE}/people/${entity.slug}` },
                  { "@type": "ListItem", position: 4, name: "Family tree", item: url },
                ],
              },
            ],
          }),
        },
      ],
    };
  },
  component: FamilyTreePage,
  notFoundComponent: () => (
    <main className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="scripture text-2xl text-foreground">No family tree for this name yet</h1>
        <Link to="/people" className="mt-6 inline-flex min-h-11 items-center rounded-full border px-4 text-sm text-foreground hover:bg-muted">
          All people
        </Link>
      </div>
    </main>
  ),
});

function flatten(n: TreeNode): TreeNode[] {
  return [n, ...(n.children ?? []).flatMap(flatten)];
}

function Node({ node, current }: { node: TreeNode; current: string }) {
  const path = nodePersonPath(node);
  const isCurrent = node.name.toLowerCase().startsWith(current.toLowerCase());
  return (
    <li className="mt-2">
      <span className={isCurrent ? "font-semibold text-foreground" : "text-foreground"}>
        {path && !isCurrent ? <a href={path} className="underline-offset-2 hover:underline">{node.name}</a> : node.name}
      </span>
      {node.role && <span className="text-muted-foreground"> — {node.role}</span>}
      {node.children?.length ? (
        <ul className="ml-3 border-l pl-4">
          {node.children.map((c) => <Node key={c.name} node={c} current={current} />)}
        </ul>
      ) : null}
    </li>
  );
}

function FamilyTreePage() {
  const { entity, tree } = Route.useLoaderData() as { entity: Entity; tree: FamilyTree };
  return (
    <main className="mx-auto max-w-2xl px-5 pb-[calc(var(--audio-bar-h,0px)+env(safe-area-inset-bottom,0px)+3rem)] pt-10">
      <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
        <Link to="/people" className="hover:text-foreground">People</Link>
        {" / "}
        <Link to="/people/$slug" params={{ slug: entity.slug }} className="hover:text-foreground">{entity.name}</Link>
      </nav>
      <h1 className="scripture mt-2 text-2xl text-foreground sm:text-3xl">{entity.name}’s Family Tree in the Bible</h1>
      {entity.curated?.summary && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{entity.curated.summary}</p>
      )}
      <section className="mt-8 rounded-lg border bg-card p-5">
        <h2 className="scripture text-lg text-foreground">{tree.heading}</h2>
        {tree.caption && <p className="mt-1 text-sm text-muted-foreground">{tree.caption}</p>}
        <ul className="mt-2 text-sm">
          <Node node={tree.root} current={entity.name} />
        </ul>
      </section>
      <p className="mt-6 text-sm">
        <Link to="/people/$slug" params={{ slug: entity.slug }} className="text-foreground underline-offset-2 hover:underline">
          Read {entity.name}’s full profile and every verse
        </Link>
      </p>
    </main>
  );
}
