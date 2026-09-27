CREATE TABLE IF NOT EXISTS public.ai_rate_limit (
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

GRANT ALL ON public.ai_rate_limit TO service_role;
ALTER TABLE public.ai_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_ai_quota(
  _bucket TEXT,
  _limit INTEGER,
  _window_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _start TIMESTAMPTZ;
  _count INTEGER;
BEGIN
  IF _bucket IS NULL OR length(_bucket) = 0 OR length(_bucket) > 200 THEN
    RETURN FALSE;
  END IF;
  _start := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds);

  INSERT INTO public.ai_rate_limit AS r (bucket, window_start, count)
  VALUES (_bucket, _start, 1)
  ON CONFLICT (bucket, window_start)
  DO UPDATE SET count = r.count + 1
  RETURNING r.count INTO _count;

  IF random() < 0.01 THEN
    DELETE FROM public.ai_rate_limit WHERE window_start < now() - INTERVAL '2 days';
  END IF;

  RETURN _count <= _limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(TEXT, INTEGER, INTEGER) TO service_role;

CREATE INDEX IF NOT EXISTS share_events_created_at_idx ON public.share_events (created_at DESC);
CREATE INDEX IF NOT EXISTS whats_new_events_created_at_idx ON public.whats_new_events (created_at DESC);

CREATE OR REPLACE FUNCTION public.prune_analytics_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.share_events WHERE created_at < now() - INTERVAL '90 days';
  DELETE FROM public.whats_new_events WHERE created_at < now() - INTERVAL '90 days';
$$;

REVOKE ALL ON FUNCTION public.prune_analytics_events() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prune_analytics_events() TO service_role;