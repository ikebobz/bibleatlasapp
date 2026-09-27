-- 1. Validate concordance_searches inserts (length limits, like other event tables)
DROP POLICY IF EXISTS "Anyone can log a concordance search" ON public.concordance_searches;
CREATE POLICY "Anyone can log a concordance search"
ON public.concordance_searches
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(term) BETWEEN 1 AND 100
  AND (device_id IS NULL OR length(device_id) <= 64)
);

-- 2. Make read access on analytics/event tables explicitly fail-closed
REVOKE SELECT, UPDATE, DELETE ON public.concordance_searches FROM anon, authenticated;
REVOKE SELECT, UPDATE, DELETE ON public.share_events FROM anon, authenticated;
REVOKE SELECT, UPDATE, DELETE ON public.nav_events FROM anon, authenticated;
REVOKE SELECT, UPDATE, DELETE ON public.whats_new_events FROM anon, authenticated;

GRANT ALL ON public.concordance_searches TO service_role;
GRANT ALL ON public.share_events TO service_role;
GRANT ALL ON public.nav_events TO service_role;
GRANT ALL ON public.whats_new_events TO service_role;

DROP POLICY IF EXISTS "No client reads of concordance searches" ON public.concordance_searches;
CREATE POLICY "No client reads of concordance searches"
ON public.concordance_searches FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "No client reads of share events" ON public.share_events;
CREATE POLICY "No client reads of share events"
ON public.share_events FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "No client reads of nav events" ON public.nav_events;
CREATE POLICY "No client reads of nav events"
ON public.nav_events FOR SELECT TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "No client reads of whats new events" ON public.whats_new_events;
CREATE POLICY "No client reads of whats new events"
ON public.whats_new_events FOR SELECT TO anon, authenticated USING (false);