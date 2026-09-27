ALTER TABLE public.concordance_terms ADD COLUMN IF NOT EXISTS verses integer NOT NULL DEFAULT 0;

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
  RETURN rebuilt;
END;
$$;

REVOKE ALL ON FUNCTION public.rebuild_concordance_terms() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rebuild_concordance_terms() TO service_role;

SELECT public.rebuild_concordance_terms();