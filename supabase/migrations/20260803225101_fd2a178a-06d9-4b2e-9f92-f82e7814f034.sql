CREATE TABLE IF NOT EXISTS public.ops_metrics (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  surface TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'ai',
  outcome TEXT NOT NULL,
  cache TEXT,
  source TEXT,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  detail TEXT
);

GRANT ALL ON public.ops_metrics TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.ops_metrics_id_seq TO service_role;
ALTER TABLE public.ops_metrics ENABLE ROW LEVEL SECURITY;
-- No policies: this is server-only operational telemetry, written and read
-- exclusively by the service role. Deny-all for anon/authenticated is intended.

CREATE INDEX IF NOT EXISTS ops_metrics_created_at_idx ON public.ops_metrics (created_at DESC);
CREATE INDEX IF NOT EXISTS ops_metrics_surface_created_idx ON public.ops_metrics (surface, created_at DESC);

-- Aggregate per surface over a window: volume, error rate, cache hit rate, latency percentiles.
CREATE OR REPLACE FUNCTION public.ops_metrics_summary(_since TIMESTAMPTZ)
RETURNS TABLE (
  surface TEXT,
  kind TEXT,
  total BIGINT,
  errors BIGINT,
  rate_limited BIGINT,
  cache_hits BIGINT,
  cache_eligible BIGINT,
  p50 INTEGER,
  p95 INTEGER,
  max_ms INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.surface,
    MIN(m.kind) AS kind,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE m.outcome = 'error') AS errors,
    COUNT(*) FILTER (WHERE m.outcome = 'rate_limited') AS rate_limited,
    COUNT(*) FILTER (WHERE m.cache = 'hit') AS cache_hits,
    COUNT(*) FILTER (WHERE m.cache IS NOT NULL) AS cache_eligible,
    COALESCE(PERCENTILE_DISC(0.5) WITHIN GROUP (ORDER BY m.duration_ms) FILTER (WHERE m.cache IS DISTINCT FROM 'hit'), 0)::INTEGER AS p50,
    COALESCE(PERCENTILE_DISC(0.95) WITHIN GROUP (ORDER BY m.duration_ms) FILTER (WHERE m.cache IS DISTINCT FROM 'hit'), 0)::INTEGER AS p95,
    COALESCE(MAX(m.duration_ms), 0)::INTEGER AS max_ms
  FROM public.ops_metrics m
  WHERE m.created_at >= _since
  GROUP BY m.surface
  ORDER BY COUNT(*) DESC;
$$;

-- Hourly time series for the dashboard chart.
CREATE OR REPLACE FUNCTION public.ops_metrics_series(_since TIMESTAMPTZ)
RETURNS TABLE (
  bucket TIMESTAMPTZ,
  total BIGINT,
  errors BIGINT,
  cache_hits BIGINT,
  p95 INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    date_trunc('hour', m.created_at) AS bucket,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE m.outcome = 'error') AS errors,
    COUNT(*) FILTER (WHERE m.cache = 'hit') AS cache_hits,
    COALESCE(PERCENTILE_DISC(0.95) WITHIN GROUP (ORDER BY m.duration_ms) FILTER (WHERE m.cache IS DISTINCT FROM 'hit'), 0)::INTEGER AS p95
  FROM public.ops_metrics m
  WHERE m.created_at >= _since
  GROUP BY 1
  ORDER BY 1;
$$;

-- Retention: operational telemetry is only useful recently.
CREATE OR REPLACE FUNCTION public.prune_ops_metrics()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.ops_metrics WHERE created_at < now() - INTERVAL '14 days';
$$;

REVOKE ALL ON FUNCTION public.ops_metrics_summary(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ops_metrics_series(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prune_ops_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ops_metrics_summary(TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.ops_metrics_series(TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.prune_ops_metrics() TO service_role;