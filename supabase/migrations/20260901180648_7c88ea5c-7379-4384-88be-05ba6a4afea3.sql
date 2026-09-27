REVOKE EXECUTE ON FUNCTION public.touch_ai_cache(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.claim_ai_cache_key(text, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.release_ai_cache_key(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.ai_cache_overview() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.touch_ai_cache(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_ai_cache_key(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_cache_key(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ai_cache_overview() TO service_role;