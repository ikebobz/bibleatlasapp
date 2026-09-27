REVOKE ALL ON FUNCTION public.consume_ai_quota(TEXT, INTEGER, INTEGER) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.prune_analytics_events() FROM anon, authenticated;