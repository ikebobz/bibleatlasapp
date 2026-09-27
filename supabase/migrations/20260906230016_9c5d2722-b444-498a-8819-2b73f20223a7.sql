CREATE OR REPLACE FUNCTION public.claim_ai_cache_key(
  _key text,
  _owner text,
  _lease_seconds integer DEFAULT 90
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _claimed_owner text;
BEGIN
  IF _key IS NULL OR length(_key) = 0 OR length(_key) > 400
     OR _owner IS NULL OR length(_owner) < 16 OR length(_owner) > 128 THEN
    RETURN false;
  END IF;

  INSERT INTO public.ai_cache_claims AS claims
    (cache_key, owner_token, claimed_at, expires_at)
  VALUES
    (_key, _owner, now(), now() + make_interval(secs => greatest(30, least(_lease_seconds, 600))))
  ON CONFLICT (cache_key) DO UPDATE
    SET owner_token = EXCLUDED.owner_token,
        claimed_at = EXCLUDED.claimed_at,
        expires_at = EXCLUDED.expires_at
    WHERE claims.expires_at <= now()
  RETURNING owner_token INTO _claimed_owner;

  RETURN coalesce(_claimed_owner = _owner, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.renew_ai_cache_key(
  _key text,
  _owner text,
  _lease_seconds integer DEFAULT 90
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _affected bigint;
BEGIN
  UPDATE public.ai_cache_claims
  SET expires_at = now() + make_interval(secs => greatest(30, least(_lease_seconds, 600)))
  WHERE cache_key = _key
    AND owner_token = _owner
    AND expires_at > now();

  GET DIAGNOSTICS _affected = ROW_COUNT;
  RETURN _affected > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_ai_cache_key(_key text, _owner text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _affected bigint;
BEGIN
  DELETE FROM public.ai_cache_claims
  WHERE cache_key = _key AND owner_token = _owner;

  GET DIAGNOSTICS _affected = ROW_COUNT;
  RETURN _affected > 0;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_ai_cache_key(text, text, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.renew_ai_cache_key(text, text, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.release_ai_cache_key(text, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.claim_ai_cache_key(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.renew_ai_cache_key(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_cache_key(text, text) TO service_role;