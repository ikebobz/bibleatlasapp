CREATE TABLE public.nav_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event text NOT NULL,
  book text,
  chapter integer,
  verse integer,
  device_type text,
  reader_type text,
  release_version text,
  device_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.nav_events TO anon, authenticated;
GRANT ALL ON public.nav_events TO service_role;

ALTER TABLE public.nav_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record a navigation event"
ON public.nav_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event = ANY (ARRAY[
    'bible_selector_opened','book_selected','chapter_selected','verse_selector_opened',
    'verse_selected','verse_navigation_completed','whats_new_shown','whats_new_dismissed','whats_new_cta_clicked'
  ])
  AND (book IS NULL OR length(book) <= 40)
  AND (chapter IS NULL OR (chapter >= 1 AND chapter <= 200))
  AND (verse IS NULL OR (verse >= 1 AND verse <= 200))
  AND (device_type IS NULL OR device_type = ANY (ARRAY['mobile','desktop']))
  AND (reader_type IS NULL OR reader_type = ANY (ARRAY['new','returning']))
  AND (release_version IS NULL OR length(release_version) <= 32)
  AND (device_id IS NULL OR length(device_id) <= 64)
);

CREATE INDEX nav_events_created_at_idx ON public.nav_events (created_at DESC);

CREATE OR REPLACE FUNCTION public.prune_analytics_events()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  DELETE FROM public.share_events WHERE created_at < now() - INTERVAL '90 days';
  DELETE FROM public.whats_new_events WHERE created_at < now() - INTERVAL '90 days';
  DELETE FROM public.nav_events WHERE created_at < now() - INTERVAL '90 days';
$function$;