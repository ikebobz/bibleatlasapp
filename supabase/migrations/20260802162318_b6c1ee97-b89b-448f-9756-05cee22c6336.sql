CREATE TABLE public.share_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  channel TEXT,
  resource_type TEXT NOT NULL DEFAULT 'verse',
  resource_ref TEXT,
  translation TEXT,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.share_events TO anon;
GRANT INSERT ON public.share_events TO authenticated;
GRANT ALL ON public.share_events TO service_role;

ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a share event"
ON public.share_events FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE INDEX share_events_created_at_idx ON public.share_events (created_at DESC);