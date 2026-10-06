import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRightIcon, GlobeIcon, LoaderCircleIcon, SearchIcon, UserIcon } from 'lucide-react';
import { lakehouseApi } from '../../utils/lakehouseClient';
import type { SearchResult, SearchResultType } from '../../types/dashboard';

const TYPE_ICON: Record<SearchResultType, typeof SearchIcon> = {
  transaction: ArrowLeftRightIcon,
  account: UserIcon,
  country: GlobeIcon
};

export function SearchBox() {
  const navigate = useNavigate();
  const onSelect = (r: SearchResult) => {
    if (r.type === 'country') navigate(`/geo-risk?country=${encodeURIComponent(r.title)}`);else
    navigate(`/transactions?q=${encodeURIComponent(r.title)}`);
    setQuery('');
  };
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const id = window.setTimeout(() => {
      lakehouseApi.
      search(q, controller.signal).
      then((r) => {
        setResults(r);
        setError(null);
      }).
      catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Search failed');
      }).
      finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(id);
    };
  }, [query]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const showPanel = open && query.trim().length > 0;

  return (
    <div ref={wrapRef} className="relative w-full max-w-[420px]">
      <label htmlFor="global-search" className="sr-only">
        Search transactions, IDs, countries, accounts
      </label>
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden />
      <input
        id="global-search"
        type="search"
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && query.trim()) {
            if (results.length > 0) onSelect(results[0]);else
            navigate(`/transactions?q=${encodeURIComponent(query.trim())}`);
            setOpen(false);
          }
        }}
        placeholder="Search transactions, IDs, countries, accounts..."
        className="h-10 w-full rounded-xl border border-line bg-white pl-10 pr-3 text-[13px] text-ink placeholder:text-ink-soft focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100" />
      
      <AnimatePresence>
        {showPanel &&
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-line bg-white shadow-float"
          role="listbox">
          
            {loading &&
          <div className="flex items-center gap-2 px-4 py-3 text-xs text-ink-soft">
                <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" aria-hidden /> Searching lakehouse…
              </div>
          }
            {!loading && error && <p className="px-4 py-3 text-xs text-declined">{error}</p>}
            {!loading && !error && results.length === 0 &&
          <p className="px-4 py-3 text-xs text-ink-soft">No matches for “{query.trim()}”.</p>
          }
            {!loading &&
          !error &&
          results.map((r) => {
            const Icon = TYPE_ICON[r.type];
            return (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-brand-50 focus:bg-brand-50 focus:outline-none">
                
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink">{r.title}</span>
                      <span className="block truncate text-[11px] text-ink-soft">{r.subtitle}</span>
                    </span>
                  </button>);

          })}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}