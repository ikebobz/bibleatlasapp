ALTER TABLE public.atlas_context
  ADD COLUMN IF NOT EXISTS prompt_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS translation text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz,
  ADD COLUMN IF NOT EXISTS tokens integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS atlas_context_kind_usage_idx ON public.atlas_context (kind, usage_count DESC);

CREATE TABLE IF NOT EXISTS public.ai_cache_claims (
  cache_key text PRIMARY KEY,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.ai_cache_claims TO service_role;
ALTER TABLE public.ai_cache_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access to ai cache claims"
  ON public.ai_cache_claims FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.touch_ai_cache(_key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.atlas_context
  SET usage_count = usage_count + 1, last_accessed_at = now()
  WHERE cache_key = _key;
$$;

CREATE OR REPLACE FUNCTION public.claim_ai_cache_key(_key text, _stale_seconds integer DEFAULT 90)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _won boolean;
BEGIN
  DELETE FROM public.ai_cache_claims
  WHERE claimed_at < now() - make_interval(secs => greatest(10, _stale_seconds));

  INSERT INTO public.ai_cache_claims (cache_key)
  VALUES (_key)
  ON CONFLICT (cache_key) DO NOTHING;

  GET DIAGNOSTICS _won = ROW_COUNT;
  RETURN _won;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_ai_cache_key(_key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.ai_cache_claims WHERE cache_key = _key;
$$;

CREATE OR REPLACE FUNCTION public.ai_cache_overview()
RETURNS TABLE(kind text, entries bigint, active bigint, reuses bigint, tokens_stored bigint, tokens_avoided bigint, last_created timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    c.kind,
    count(*) AS entries,
    count(*) FILTER (WHERE c.status = 'active') AS active,
    coalesce(sum(c.usage_count), 0)::bigint AS reuses,
    coalesce(sum(c.tokens), 0)::bigint AS tokens_stored,
    coalesce(sum(c.tokens * c.usage_count), 0)::bigint AS tokens_avoided,
    max(c.created_at) AS last_created
  FROM public.atlas_context c
  GROUP BY c.kind
  ORDER BY count(*) DESC;
$$;