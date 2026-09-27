-- Make the fail-closed intent explicit and future-proof for three internal tables:
-- cached API payloads, API usage counters, and device push subscriptions.
-- They are written and read exclusively by trusted server code (service role).

REVOKE ALL ON public.api_cache FROM anon, authenticated;
REVOKE ALL ON public.api_usage_daily FROM anon, authenticated;
REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;

GRANT ALL ON public.api_cache TO service_role;
GRANT ALL ON public.api_usage_daily TO service_role;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to api cache" ON public.api_cache;
CREATE POLICY "No direct access to api cache"
  ON public.api_cache FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No direct access to api usage" ON public.api_usage_daily;
CREATE POLICY "No direct access to api usage"
  ON public.api_usage_daily FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No direct access to push subscriptions" ON public.push_subscriptions;
CREATE POLICY "No direct access to push subscriptions"
  ON public.push_subscriptions FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);