CREATE TABLE public.bible_verses (
  book text NOT NULL,
  chapter integer NOT NULL,
  verse integer NOT NULL,
  text text NOT NULL,
  testament text NOT NULL,
  book_num integer NOT NULL,
  tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED,
  PRIMARY KEY (book, chapter, verse)
);

CREATE INDEX bible_verses_tsv_idx ON public.bible_verses USING GIN (tsv);
CREATE INDEX bible_verses_order_idx ON public.bible_verses (book_num, chapter, verse);

GRANT SELECT ON public.bible_verses TO anon;
GRANT SELECT ON public.bible_verses TO authenticated;
GRANT ALL ON public.bible_verses TO service_role;

ALTER TABLE public.bible_verses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Scripture is public" ON public.bible_verses
FOR SELECT USING (true);

CREATE TABLE public.concordance_terms (
  term text PRIMARY KEY,
  total integer NOT NULL DEFAULT 0,
  ot integer NOT NULL DEFAULT 0,
  nt integer NOT NULL DEFAULT 0,
  per_book jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX concordance_terms_total_idx ON public.concordance_terms (total DESC);
CREATE INDEX concordance_terms_prefix_idx ON public.concordance_terms (term text_pattern_ops);

GRANT SELECT ON public.concordance_terms TO anon;
GRANT SELECT ON public.concordance_terms TO authenticated;
GRANT ALL ON public.concordance_terms TO service_role;

ALTER TABLE public.concordance_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Concordance terms are public" ON public.concordance_terms
FOR SELECT USING (true);

CREATE TABLE public.concordance_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  device_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX concordance_searches_term_idx ON public.concordance_searches (term);
CREATE INDEX concordance_searches_created_idx ON public.concordance_searches (created_at DESC);

GRANT INSERT ON public.concordance_searches TO anon;
GRANT INSERT ON public.concordance_searches TO authenticated;
GRANT ALL ON public.concordance_searches TO service_role;

ALTER TABLE public.concordance_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a concordance search" ON public.concordance_searches
FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.concordance_verses(
  _query text,
  _testament text DEFAULT NULL,
  _book text DEFAULT NULL,
  _limit integer DEFAULT 25,
  _offset integer DEFAULT 0
)
RETURNS TABLE (
  book text,
  chapter integer,
  verse integer,
  text text,
  testament text,
  book_num integer,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH matched AS (
    SELECT v.book, v.chapter, v.verse, v.text, v.testament, v.book_num
    FROM public.bible_verses v
    WHERE v.tsv @@ plainto_tsquery('english', _query)
      AND (_testament IS NULL OR v.testament = _testament)
      AND (_book IS NULL OR v.book = _book)
  )
  SELECT m.*, (SELECT count(*) FROM matched) AS total_count
  FROM matched m
  ORDER BY m.book_num, m.chapter, m.verse
  LIMIT greatest(1, least(_limit, 100))
  OFFSET greatest(0, _offset);
$$;

CREATE OR REPLACE FUNCTION public.concordance_book_counts(_query text)
RETURNS TABLE (book text, book_num integer, testament text, hits bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.book, v.book_num, v.testament, count(*) AS hits
  FROM public.bible_verses v
  WHERE v.tsv @@ plainto_tsquery('english', _query)
  GROUP BY v.book, v.book_num, v.testament
  ORDER BY v.book_num;
$$;

GRANT EXECUTE ON FUNCTION public.concordance_verses(text, text, text, integer, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.concordance_book_counts(text) TO anon, authenticated, service_role;