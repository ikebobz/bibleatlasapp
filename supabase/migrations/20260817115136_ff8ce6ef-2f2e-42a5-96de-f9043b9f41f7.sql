CREATE TABLE public.admin_credentials (
  id boolean NOT NULL DEFAULT true PRIMARY KEY,
  passcode_hash text NOT NULL,
  salt text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_credentials_single_row CHECK (id)
);

GRANT ALL ON public.admin_credentials TO service_role;
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_admin_credentials_updated_at
BEFORE UPDATE ON public.admin_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.admin_reset_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  requester_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_reset_tokens_expires_idx ON public.admin_reset_tokens (expires_at);

GRANT ALL ON public.admin_reset_tokens TO service_role;
ALTER TABLE public.admin_reset_tokens ENABLE ROW LEVEL SECURITY;