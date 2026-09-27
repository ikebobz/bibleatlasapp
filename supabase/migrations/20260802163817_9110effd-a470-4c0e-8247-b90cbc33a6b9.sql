DROP POLICY IF EXISTS "Anyone can record a share event" ON public.share_events;

CREATE POLICY "Anyone can record a share event"
ON public.share_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event = ANY (ARRAY['share_opened','share_sent','link_opened','install_prompt_shown','install_accepted','install_dismissed'])
  AND resource_type = ANY (ARRAY['verse','entry','thread','chapter'])
  AND (channel IS NULL OR length(channel) <= 32)
  AND (resource_ref IS NULL OR length(resource_ref) <= 128)
  AND (translation IS NULL OR length(translation) <= 16)
  AND (device_id IS NULL OR length(device_id) <= 64)
);