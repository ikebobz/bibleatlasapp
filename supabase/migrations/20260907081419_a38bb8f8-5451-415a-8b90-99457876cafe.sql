CREATE OR REPLACE FUNCTION public.ai_cache_by_reference(_kind text DEFAULT NULL, _limit integer DEFAULT 50)
RETURNS TABLE(label text, entries bigint, reuses bigint, tokens_stored bigint, tokens_saved bigint, last_used timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    coalesce(nullif(c.reference, ''), '(no verse)') AS label,
    count(*) AS entries,
    coalesce(sum(c.usage_count), 0)::bigint AS reuses,
    coalesce(sum(c.tokens), 0)::bigint AS tokens_stored,
    coalesce(sum(c.tokens * c.usage_count), 0)::bigint AS tokens_saved,
    max(coalesce(c.last_accessed_at, c.created_at)) AS last_used
  FROM public.atlas_context c
  WHERE _kind IS NULL OR c.kind = _kind
  GROUP BY 1
  ORDER BY coalesce(sum(c.tokens * c.usage_count), 0) DESC, count(*) DESC
  LIMIT greatest(1, least(coalesce(_limit, 50), 200));
$$;

CREATE OR REPLACE FUNCTION public.ai_cache_by_term(_kind text DEFAULT NULL, _limit integer DEFAULT 50)
RETURNS TABLE(label text, entries bigint, reuses bigint, tokens_stored bigint, tokens_saved bigint, last_used timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    coalesce(nullif(lower(c.term), ''), '(no word)') AS label,
    count(*) AS entries,
    coalesce(sum(c.usage_count), 0)::bigint AS reuses,
    coalesce(sum(c.tokens), 0)::bigint AS tokens_stored,
    coalesce(sum(c.tokens * c.usage_count), 0)::bigint AS tokens_saved,
    max(coalesce(c.last_accessed_at, c.created_at)) AS last_used
  FROM public.atlas_context c
  WHERE _kind IS NULL OR c.kind = _kind
  GROUP BY 1
  ORDER BY coalesce(sum(c.tokens * c.usage_count), 0) DESC, count(*) DESC
  LIMIT greatest(1, least(coalesce(_limit, 50), 200));
$$;

REVOKE ALL ON FUNCTION public.ai_cache_by_reference(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ai_cache_by_term(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_cache_by_reference(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_cache_by_term(text, integer) TO service_role;