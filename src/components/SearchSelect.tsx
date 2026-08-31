import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group';

export interface SearchSelectOption {
  label: string;
  value: string;
}

/** Debounced async-search combobox — used for référentiels too large to load
 * in full up front (e.g. villes). `onSearch` is called (debounced) as the
 * user types and should resolve a short list of matches.
 *
 * The results list is rendered in a portal at `position: fixed`, not as a
 * plain absolutely-positioned child — most call sites live inside a Card
 * (overflow-hidden), which would otherwise clip the dropdown invisible. */
export default function SearchSelect({
  placeholder,
  selectedLabel,
  onSearch,
  onSelect,
  onClear,
}: {
  placeholder: string;
  selectedLabel?: string | null;
  onSearch: (query: string) => Promise<SearchSelectOption[]>;
  onSelect: (option: SearchSelectOption) => void;
  onClear?: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SearchSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function updateRect() {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updateRect();
    const onReposition = () => updateRect();
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) return;
      if (listRef.current && listRef.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleChange(v: string) {
    setQuery(v);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        setOptions(await onSearch(v));
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  if (selectedLabel && !open) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="flex h-8 flex-1 items-center rounded-md border border-border bg-background px-2.5 text-label text-foreground">
          {selectedLabel}
        </span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Effacer"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    );
  }

  const showList = open && (query.length > 0 || options.length > 0);

  return (
    <div ref={containerRef}>
      <InputGroup>
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => handleChange(e.target.value)}
        />
      </InputGroup>
      {showList &&
        rect &&
        createPortal(
          <div
            ref={listRef}
            style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width }}
            className="z-50 max-h-55 overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg"
          >
            {loading && <div className="px-3 py-2 text-xs text-muted-foreground">Recherche…</div>}
            {!loading && options.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">Aucun résultat.</div>}
            {!loading &&
              options.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => {
                    onSelect(o);
                    setQuery('');
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-label text-foreground hover:bg-muted"
                >
                  {o.label}
                </button>
              ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
