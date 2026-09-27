DROP POLICY "Anyone can record a navigation event" ON public.nav_events;

CREATE POLICY "Anyone can record a navigation event"
ON public.nav_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  (event = ANY (ARRAY[
    'bible_selector_opened','book_selected','chapter_selected','verse_selector_opened',
    'verse_selected','verse_navigation_completed','whats_new_shown','whats_new_dismissed',
    'whats_new_cta_clicked',
    'offline_kjv_prompt_shown','offline_kjv_prompt_dismissed','kjv_download_started',
    'kjv_download_completed','kjv_download_failed','kjv_deleted','offline_mode_used'
  ]))
  AND ((book IS NULL) OR (length(book) <= 40))
  AND ((chapter IS NULL) OR ((chapter >= 1) AND (chapter <= 200)))
  AND ((verse IS NULL) OR ((verse >= 1) AND (verse <= 200)))
  AND ((device_type IS NULL) OR (device_type = ANY (ARRAY['mobile','desktop'])))
  AND ((reader_type IS NULL) OR (reader_type = ANY (ARRAY['new','returning'])))
  AND ((release_version IS NULL) OR (length(release_version) <= 32))
  AND ((device_id IS NULL) OR (length(device_id) <= 64))
);