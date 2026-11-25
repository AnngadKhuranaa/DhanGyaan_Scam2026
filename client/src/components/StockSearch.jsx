import { useEffect, useId, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { marketService } from '../services';
import useDebounce from '../hooks/useDebounce';
import useUIStore from '../store/useUIStore';
import { Spinner } from './ui/States';

/**
 * Accessible ticker autocomplete (ARIA combobox): type to search Yahoo via
 * the API, arrow keys to move, Enter to pick, Escape to close.
 */
export default function StockSearch({ onSelect, placeholder, autoFocus = false, className = '', allMarkets = false }) {
  const market = useUIStore((s) => s.market);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounced = useDebounce(query.trim(), 250);
  const listId = useId();
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!debounced) return undefined;
    let cancelled = false;
    marketService
      .search(debounced, allMarkets ? undefined : market)
      .then((items) => {
        if (cancelled) return;
        setResults(items);
        setError('');
        setActive(items.length ? 0 : -1);
        setOpen(true);
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setError('Search is unavailable right now');
          setOpen(true);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced, market, allMarkets]);

  useEffect(() => {
    const onClick = (e) => !wrapperRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const choose = (item) => {
    onSelect(item);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && open && results[active]) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // An empty query shows nothing; derived here instead of resetting state in an effect.
  const visible = debounced ? results : [];
  const showList = open && debounced && (visible.length > 0 || error || !loading);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="text"
        role="combobox"
        aria-expanded={Boolean(showList)}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 && results[active] ? `${listId}-${active}` : undefined}
        aria-label="Search stocks"
        autoFocus={autoFocus}
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setLoading(Boolean(e.target.value.trim())); // cleared by the search effect when results arrive
        }}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder || (market === 'IN' ? 'Search NSE stocks, e.g. Infosys' : 'Search US stocks, e.g. Apple')}
        className="input pl-9 pr-9"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <Spinner size={14} label="Searching" />
        </span>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {error && <li className="px-3 py-2 text-sm text-loss-c">{error}</li>}
          {!error && visible.length === 0 && <li className="muted px-3 py-2 text-sm">No matches for “{debounced}”</li>}
          {visible.map((r, i) => (
            <li
              key={r.symbol}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(r)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                i === active ? 'bg-brand-50 dark:bg-slate-800' : ''
              }`}
            >
              <span className="min-w-0">
                <span className="font-semibold text-slate-900 dark:text-white">{r.symbol}</span>
                <span className="muted ml-2 truncate">{r.name}</span>
              </span>
              <span className="badge-neutral shrink-0">{r.exchange}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
