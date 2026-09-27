/**
 * Family-tree pages come only from trees already written in the reader's
 * atlas entries — nothing is added or inferred here.
 */
import { ATLAS_ENTRIES } from "@/lib/atlas/entries";
import type { TreeNode } from "@/lib/atlas/types";
import { entityByName, entityBySlug, entityPath } from "./registry";

export type FamilyTree = { slug: string; heading: string; caption?: string; root: TreeNode };

const bareName = (name: string) => name.replace(/\s*\(.*\)$/, "").trim();

function build(): Map<string, FamilyTree> {
  const out = new Map<string, FamilyTree>();
  for (const entry of ATLAS_ENTRIES) {
    if (entry.kind !== "person") continue;
    const block = entry.blocks.find((b) => b.type === "tree");
    if (!block || block.type !== "tree") continue;
    const person = entityBySlug("person", entry.id) ?? entityByName(bareName(entry.title));
    if (!person || person.type !== "person" || !person.published) continue;
    out.set(person.slug, { slug: person.slug, heading: block.heading, caption: block.caption, root: block.root });
  }
  return out;
}

const TREES = build();

export function familyTreeFor(slug: string): FamilyTree | undefined {
  return TREES.get(slug);
}

export function familyTreeSlugs(): string[] {
  return [...TREES.keys()];
}

/** Published person page for a node, if there is one. */
export function nodePersonPath(node: TreeNode): string | null {
  const e = entityByName(bareName(node.name));
  return e && e.type === "person" && e.published ? entityPath(e) : null;
}

/** The node for the page's person, with its parent, to fill Person JSON-LD. */
export function findInTree(
  root: TreeNode,
  name: string,
  parent: TreeNode | null = null,
): { node: TreeNode; parent: TreeNode | null } | null {
  if (bareName(root.name).toLowerCase() === name.toLowerCase()) return { node: root, parent };
  for (const c of root.children ?? []) {
    const hit = findInTree(c, name, root);
    if (hit) return hit;
  }
  return null;
}
