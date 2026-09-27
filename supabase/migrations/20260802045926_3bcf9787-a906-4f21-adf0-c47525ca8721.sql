CREATE TABLE public.whats_new_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  release_version TEXT NOT NULL,
  last_seen_version TEXT,
  unseen_count INTEGER NOT NULL DEFAULT 0,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX whats_new_events_version_event_idx ON public.whats_new_events (release_version, event);
CREATE INDEX whats_new_events_created_at_idx ON public.whats_new_events (created_at DESC);

GRANT INSERT ON public.whats_new_events TO anon;
GRANT INSERT ON public.whats_new_events TO authenticated;
GRANT ALL ON public.whats_new_events TO service_role;

ALTER TABLE public.whats_new_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a whats new event"
ON public.whats_new_events FOR INSERT TO anon, authenticated
WITH CHECK (
  event IN ('banner_impression','banner_click','banner_dismiss','nav_click','page_view')
  AND length(release_version) <= 32
  AND (last_seen_version IS NULL OR length(last_seen_version) <= 32)
  AND length(device_id) <= 64
  AND unseen_count >= 0
);