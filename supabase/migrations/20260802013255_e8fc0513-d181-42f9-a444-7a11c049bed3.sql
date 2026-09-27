SELECT cron.unschedule('bible-atlas-build-daily-verse') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bible-atlas-build-daily-verse');
SELECT cron.unschedule('bible-atlas-send-daily-verse') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'bible-atlas-send-daily-verse');

SELECT cron.schedule(
  'bible-atlas-build-daily-verse',
  '5 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bibleatlas.lovable.app/api/public/push/build-daily',
    headers := jsonb_build_object('content-type','application/json','x-cron-secret','YZVUN-UHjmiNg14Bg7nEl06b1LJhBU4e'),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'bible-atlas-send-daily-verse',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://bibleatlas.lovable.app/api/public/push/send-daily',
    headers := jsonb_build_object('content-type','application/json','x-cron-secret','YZVUN-UHjmiNg14Bg7nEl06b1LJhBU4e'),
    body := '{}'::jsonb
  );
  $$
);