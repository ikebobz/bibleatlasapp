REVOKE SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public.whats_new_events FROM anon, authenticated;
GRANT INSERT ON public.whats_new_events TO anon, authenticated;
GRANT ALL ON public.whats_new_events TO service_role;