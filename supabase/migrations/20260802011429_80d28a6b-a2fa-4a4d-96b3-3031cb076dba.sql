CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  translation text NOT NULL DEFAULT 'kjv',
  timezone text,
  user_agent text,
  failure_count integer NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO service_role;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.daily_verse (
  day date PRIMARY KEY,
  source text NOT NULL DEFAULT 'fallback',
  title text NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  end_verse integer,
  season text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.daily_verse TO anon;
GRANT SELECT ON public.daily_verse TO authenticated;
GRANT ALL ON public.daily_verse TO service_role;
ALTER TABLE public.daily_verse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily verse is public" ON public.daily_verse FOR SELECT TO anon, authenticated USING (true);