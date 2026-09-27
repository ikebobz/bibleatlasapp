import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { concordanceSuggest } from "@/lib/concordance/search.functions";
import { termSlug } from "@/lib/concordance/terms";
import { useDismissibleLayer } from "@/hooks/use-dismissible-layer";

/** Search box with word suggestions drawn from the indexed KJV vocabulary. */
export function ConcordanceSearch({
  initial = "",
  autoFocus = false,
}: {
  initial?: string;
  autoFocus?: boolean;
}) {
  const navigate = useNavigate();
  const suggest = useServerFn(concordanceSuggest);
  const [value, setValue] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value.trim()), 180);
    return () => clearTimeout(id);
  }, [value]);

  useDismissibleLayer({ refs: [boxRef], enabled: open, onDismiss: () => setOpen(false), restoreFocusRef: inputRef });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["concordance-suggest", debounced],
    queryFn: () => suggest({ data: { prefix: debounced } }),
    enabled: debounced.length >= 2,
    staleTime: 1000 * 60 * 10,
  });

  const go = (term: string) => {
    const slug = termSlug(term);
    if (!slug) return;
    setOpen(false);
    void navigate({ to: "/concordance/$term", params: { term: slug }, search: { page: 1 } });
  };

  return (
    <div ref={boxRef} className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        role="search"
        className="flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-ring"
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          aria-label="Search the Bible concordance"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="concordance-suggestions"
          placeholder="Search any word — covenant, Jerusalem, mercy…"
          className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Search
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul id="concordance-suggestions" className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border bg-popover p-1.5 shadow-xl">
          {suggestions.map((s) => (
            <li key={s.word}>
              <button
                type="button"
                onClick={() => go(s.word)}
                className="flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <span className="text-sm text-foreground">{s.word}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {s.total.toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
