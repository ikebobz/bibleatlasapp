/**
 * Shared context cache. Generated Atlas content is written once and reused by
 * every reader, so a chapter that has been visited before opens instantly and
 * shows identical notes to everyone.
 */

export type CacheKind = "context" | "purpose" | "lexicon" | "thread" | "place" | "audio";

function keyOf(kind: CacheKind, term: string, reference: string) {
  return `${kind}|${term.trim().toLowerCase()}|${reference.trim().toLowerCase()}`;
}

/** Best-effort read: a cache miss or an outage must never block reading. */
export async function readCachedContext<T>(
  kind: CacheKind,
  term: string,
  reference: string,
): Promise<T | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("atlas_context")
      .select("payload")
      .eq("cache_key", keyOf(kind, term, reference))
      .maybeSingle();
    if (error || !data) return null;
    return data.payload as T;
  } catch {
    return null;
  }
}

/** Best-effort write; conflicts simply mean another reader got there first. */
export async function writeCachedContext(
  kind: CacheKind,
  term: string,
  reference: string,
  payload: unknown,
  model = "google/gemini-2.5-flash",
): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("atlas_context")
      .upsert(
        {
          cache_key: keyOf(kind, term, reference),
          kind,
          term: term.slice(0, 200),
          reference: reference.slice(0, 120),
          payload: payload as never,
          model,
        },
        { onConflict: "cache_key" },
      );
    // A silently failing cache looks identical to a cold cache, so make it loud.
    if (error) console.error("Shared cache write failed", { kind, code: error.code, message: error.message?.slice(0, 200) });
  } catch (error) {
    // Caching is an optimisation, not a requirement.
    console.error("Shared cache write threw", { kind, message: String(error).slice(0, 200) });
  }
}
