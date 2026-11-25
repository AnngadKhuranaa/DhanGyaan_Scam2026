import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function StockSearchDropdown({ value, onChange, onSelectStock }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStocks = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/stocks/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setQuery(val);
    onChange?.(val);
    setActiveIndex(-1);
    setIsOpen(true);

    // Debounce API call (300ms)
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchStocks(val), 300);
  };

  const selectStock = (symbol) => {
    setQuery(symbol);
    onChange?.(symbol);
    onSelectStock?.(symbol);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter') {
        onChange?.(query);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          selectStock(results[activeIndex].symbol);
        } else {
          onChange?.(query);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          className="fintech-input w-32 pl-8 pr-3 py-2.5 text-sm"
          placeholder="AAPL"
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (query.trim().length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            {isSearching ? (
              <div className="p-4 text-center text-xs text-slate-400">Searching...</div>
            ) : results.length > 0 ? (
              <ul className="max-h-64 overflow-y-auto py-1 scrollbar-hide">
                {results.map((stock, i) => (
                  <li key={stock.symbol}>
                    <button
                      onClick={() => selectStock(stock.symbol)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        activeIndex === i ? 'bg-brand-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                        <TrendingUp size={14} className="text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">{stock.symbol}</p>
                        <p className="truncate text-xs text-slate-500">{stock.name}</p>
                      </div>
                      {activeIndex === i && (
                        <span className="text-[10px] text-slate-400">↵</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No stocks found for "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
