-- Shared, transient cache for external provider responses.
CREATE TABLE IF NOT EXISTS public.api_cache (
  key text PRIMARY KEY,
  provider text NOT NULL,
  feature text NOT NULL,
  translation text,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.api_cache TO service_role;
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies: internal server-side cache, unreachable via the Data API.

CREATE INDEX IF NOT EXISTS api_cache_expires_idx ON public.api_cache (expires_at);

CREATE OR REPLACE FUNCTION public.purge_api_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.api_cache WHERE expires_at < now();
$$;

REVOKE ALL ON FUNCTION public.purge_api_cache() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_api_cache() TO service_role;

-- Durable per-day counter of real (uncached) external requests.
CREATE TABLE IF NOT EXISTS public.api_usage_daily (
  day date NOT NULL,
  provider text NOT NULL,
  feature text NOT NULL,
  calls integer NOT NULL DEFAULT 0,
  PRIMARY KEY (day, provider, feature)
);

GRANT ALL ON public.api_usage_daily TO service_role;
ALTER TABLE public.api_usage_daily ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies: admin surfaces read it through trusted server code.

CREATE OR REPLACE FUNCTION public.bump_api_usage(_provider text, _feature text, _calls integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.api_usage_daily (day, provider, feature, calls)
  VALUES (current_date, left(coalesce(_provider, 'unknown'), 40), left(coalesce(_feature, 'unknown'), 40), greatest(1, _calls))
  ON CONFLICT (day, provider, feature)
  DO UPDATE SET calls = public.api_usage_daily.calls + greatest(1, _calls);
END;
$$;

REVOKE ALL ON FUNCTION public.bump_api_usage(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_api_usage(text, text, integer) TO service_role;