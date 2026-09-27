ALTER TABLE public.ai_cache_claims
  ADD COLUMN IF NOT EXISTS owner_token text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.ai_cache_claims
SET owner_token = coalesce(owner_token, encode(gen_random_bytes(16), 'hex')),
    expires_at = coalesce(expires_at, claimed_at + interval '90 seconds');

ALTER TABLE public.ai_cache_claims
  ALTER COLUMN owner_token SET NOT NULL,
  ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS ai_cache_claims_expiry_idx
  ON public.ai_cache_claims (expires_at);

REVOKE EXECUTE ON FUNCTION public.claim_ai_cache_key(text, integer) FROM service_role;
REVOKE EXECUTE ON FUNCTION public.release_ai_cache_key(text) FROM service_role;
DROP FUNCTION public.claim_ai_cache_key(text, integer);
DROP FUNCTION public.release_ai_cache_key(text);

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

  RETURN _claimed_owner = _owner;
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
  _renewed boolean;
BEGIN
  UPDATE public.ai_cache_claims
  SET expires_at = now() + make_interval(secs => greatest(30, least(_lease_seconds, 600)))
  WHERE cache_key = _key
    AND owner_token = _owner
    AND expires_at > now();

  GET DIAGNOSTICS _renewed = ROW_COUNT;
  RETURN _renewed;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_ai_cache_key(_key text, _owner text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _released boolean;
BEGIN
  DELETE FROM public.ai_cache_claims
  WHERE cache_key = _key AND owner_token = _owner;

  GET DIAGNOSTICS _released = ROW_COUNT;
  RETURN _released;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_ai_cache_key(text, text, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.renew_ai_cache_key(text, text, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.release_ai_cache_key(text, text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.claim_ai_cache_key(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.renew_ai_cache_key(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_cache_key(text, text) TO service_role;