-- Both tables are server-only: they are read and written exclusively by
-- trusted server code using the service role. Make the fail-closed intent
-- explicit at the privilege layer so a future permissive policy alone can
-- never expose them to browser clients.

REVOKE ALL ON TABLE public.admin_credentials FROM anon, authenticated;
REVOKE ALL ON TABLE public.chapter_cache FROM anon, authenticated;

GRANT ALL ON TABLE public.admin_credentials TO service_role;
GRANT ALL ON TABLE public.chapter_cache TO service_role;

ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_cache ENABLE ROW LEVEL SECURITY;

-- Force RLS so even the table owner is subject to policies; the service role
-- bypasses RLS by design and remains the only path in.
ALTER TABLE public.admin_credentials FORCE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_cache FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.admin_credentials IS
  'Server-only. Stores admin passcode hash/salt. No RLS policies and no client grants by design: never add a policy or grant for anon/authenticated.';
COMMENT ON TABLE public.chapter_cache IS
  'Server-only durable cache of public-domain Bible chapters, used as a fallback when upstream providers are rate-limited. Read/written via service role only; no client grants by design.';