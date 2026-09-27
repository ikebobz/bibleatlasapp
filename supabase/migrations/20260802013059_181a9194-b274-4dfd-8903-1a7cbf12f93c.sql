ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS send_hour smallint NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS send_minute smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sent_day date;

ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_send_hour_check;
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_send_hour_check CHECK (send_hour >= 0 AND send_hour <= 23);

ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_send_minute_check;
ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_send_minute_check CHECK (send_minute IN (0, 15, 30, 45));

UPDATE public.push_subscriptions
SET send_hour = 10, send_minute = 0, timezone = 'UTC'
WHERE timezone IS NULL OR timezone = '';

UPDATE public.push_subscriptions
SET send_hour = 7, send_minute = 0
WHERE timezone IS NOT NULL AND timezone <> 'UTC' AND send_hour = 7 AND send_minute = 0;