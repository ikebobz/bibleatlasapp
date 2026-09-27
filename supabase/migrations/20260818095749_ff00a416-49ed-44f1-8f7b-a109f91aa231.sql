CREATE TABLE public.admin_login_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  requester_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_login_tokens TO service_role;

ALTER TABLE public.admin_login_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX admin_login_tokens_expires_idx ON public.admin_login_tokens (expires_at);