ALTER TABLE public.concordance_terms ADD COLUMN IF NOT EXISTS word text;

CREATE INDEX IF NOT EXISTS concordance_terms_word_idx ON public.concordance_terms (word text_pattern_ops);

CREATE OR REPLACE FUNCTION public.rebuild_concordance_terms()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rebuilt integer;
BEGIN
  DELETE FROM public.concordance_terms;

  WITH words AS (
    SELECT v.book, v.testament, l.lexeme AS term,
           coalesce(array_length(l.positions, 1), 1) AS occurrences
    FROM public.bible_verses v, unnest(v.tsv) l
  ),
  per_book AS (
    SELECT term, book, sum(occurrences)::int AS hits, max(testament) AS testament,
           count(*)::int AS verse_hits
    FROM words
    GROUP BY term, book
  )
  INSERT INTO public.concordance_terms (term, total, ot, nt, verses, per_book)
  SELECT term,
         sum(hits)::int,
         coalesce(sum(hits) FILTER (WHERE testament = 'old'), 0)::int,
         coalesce(sum(hits) FILTER (WHERE testament = 'new'), 0)::int,
         sum(verse_hits)::int,
         jsonb_object_agg(book, hits)
  FROM per_book
  WHERE length(term) > 1
  GROUP BY term;

  GET DIAGNOSTICS rebuilt = ROW_COUNT;

  -- Pick the most common everyday spelling for each grouped word family.
  WITH surface AS (
    SELECT lower(tok[1]) AS word, count(*)::int AS hits
    FROM public.bible_verses v, regexp_matches(v.text, '[A-Za-z]{2,}', 'g') AS tok
    GROUP BY 1
  ),
  mapped AS (
    SELECT s.word, s.hits, (SELECT l.lexeme FROM unnest(to_tsvector('english', s.word)) l LIMIT 1) AS term
    FROM surface s
  ),
  best AS (
    SELECT DISTINCT ON (term) term, word
    FROM mapped
    WHERE term IS NOT NULL
    ORDER BY term, hits DESC, word
  )
  UPDATE public.concordance_terms t
  SET word = b.word
  FROM best b
  WHERE b.term = t.term;

  UPDATE public.concordance_terms SET word = term WHERE word IS NULL;

  RETURN rebuilt;
END;
$$;

CREATE OR REPLACE FUNCTION public.concordance_term_stats(_query text)
RETURNS TABLE (term text, word text, total integer, ot integer, nt integer, verses integer, per_book jsonb)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT t.term, t.word, t.total, t.ot, t.nt, t.verses, t.per_book
  FROM public.concordance_terms t
  WHERE t.term IN (
    SELECT l.lexeme FROM unnest(to_tsvector('english', _query)) l
  )
  ORDER BY t.total DESC
  LIMIT 5;
$$;

GRANT EXECUTE ON FUNCTION public.concordance_term_stats(text) TO anon, authenticated, service_role;

SELECT public.rebuild_concordance_terms();