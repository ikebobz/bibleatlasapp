CREATE TABLE public.atlas_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  kind text NOT NULL,
  term text NOT NULL,
  reference text NOT NULL DEFAULT '',
  payload jsonb NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.atlas_context TO anon;
GRANT SELECT ON public.atlas_context TO authenticated;
GRANT ALL ON public.atlas_context TO service_role;

ALTER TABLE public.atlas_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cached context is public to read"
  ON public.atlas_context FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_atlas_context_updated_at
  BEFORE UPDATE ON public.atlas_context
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX atlas_context_kind_term_idx ON public.atlas_context (kind, term);