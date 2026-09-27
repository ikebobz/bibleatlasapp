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
SECURITY INVOKER
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
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT v.book, v.book_num, v.testament, count(*) AS hits
  FROM public.bible_verses v
  WHERE v.tsv @@ plainto_tsquery('english', _query)
  GROUP BY v.book, v.book_num, v.testament
  ORDER BY v.book_num;
$$;