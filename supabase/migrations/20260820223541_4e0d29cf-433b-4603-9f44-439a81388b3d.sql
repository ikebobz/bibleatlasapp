CREATE TABLE IF NOT EXISTS public.chapter_cache (
  translation text NOT NULL,
  book text NOT NULL,
  chapter integer NOT NULL,
  verses jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (translation, book, chapter)
);

GRANT ALL ON public.chapter_cache TO service_role;

ALTER TABLE public.chapter_cache ENABLE ROW LEVEL SECURITY;
-- No policies: only server-side (service role) code reads and writes this cache.