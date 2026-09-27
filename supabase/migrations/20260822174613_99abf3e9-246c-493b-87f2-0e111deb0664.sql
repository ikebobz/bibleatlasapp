CREATE TABLE IF NOT EXISTS public.seo_backlink_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target text NOT NULL,
  captured_on date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  authority_score numeric,
  referring_domains bigint,
  backlinks_total bigint,
  referring_ips bigint,
  follows bigint,
  nofollows bigint,
  texts bigint,
  images bigint,
  top_domains jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_anchors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target, captured_on)
);

CREATE INDEX IF NOT EXISTS seo_backlink_snapshots_target_day
  ON public.seo_backlink_snapshots (target, captured_on DESC);

GRANT ALL ON public.seo_backlink_snapshots TO service_role;

ALTER TABLE public.seo_backlink_snapshots ENABLE ROW LEVEL SECURITY;

-- Fail closed: internal admin data, reachable only through the service role.
CREATE POLICY "seo_backlink_snapshots_no_public_access"
  ON public.seo_backlink_snapshots
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);