import { useEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function Simulator() {
  const [formData, setFormData] = useState({
    stock: '',
    amount: '',
    duration: '',
  });
  const [results, setResults] = useState({
    best: null,
    worst: null,
    average: null,
    probabilityOfLoss: null,
    risk: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions on stock input change
  useEffect(() => {
    const query = formData.stock.trim();

    if (query.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/stocks/search?q=${encodeURIComponent(query)}`
        );
        const text = await response.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          data = [];
        }

        setSuggestions(Array.isArray(data) ? data : []);
        setShowDropdown(Array.isArray(data) && data.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [formData.stock]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function handleSuggestionClick(symbol) {
    setFormData((current) => ({ ...current, stock: symbol }));
    setShowDropdown(false);
    setSuggestions([]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: formData.stock,
          amount: Number(formData.amount),
          duration: Number(formData.duration),
        }),
      });

      const text = await response.text();
      console.log('RAW RESPONSE:', text);

      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error('Server returned HTML instead of JSON');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Simulation failed');
      }

      setResults({
        best: data.best ?? null,
        worst: data.worst ?? null,
        average: data.average ?? null,
        probabilityOfLoss: data.probabilityOfLoss ?? null,
        risk: data.risk ?? null,
      });
    } catch (requestError) {
      setError(requestError.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const resultCards = [
    {
      label: 'Best Case',
      value: results.best !== null ? `Rs ${results.best}` : '--',
      tone: 'text-indigo-600',
    },
    {
      label: 'Worst Case',
      value: results.worst !== null ? `Rs ${results.worst}` : '--',
      tone: 'text-rose-500',
    },
    {
      label: 'Average',
      value: results.average !== null ? `Rs ${results.average}` : '--',
      tone: 'text-blue-600',
    },
    {
      label: 'Probability of Loss',
      value:
        results.probabilityOfLoss !== null ? `${results.probabilityOfLoss}%` : '--',
      tone: 'text-amber-500',
    },
  ];

  const chartData = [
    { name: 'Best', value: results.best ?? 0 },
    { name: 'Worst', value: results.worst ?? 0 },
    { name: 'Average', value: results.average ?? 0 },
  ];

  return (
    <section className="space-y-8">
      <div className="section-header">
        <h1 className="section-title">Simulator</h1>
        <p className="section-copy">
          Simulate investment outcomes with AI-driven risk analysis and probability modeling.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="fintech-card animate-fade-in">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-600">Stock Name</span>
              <div className="relative">
                <input
                  ref={inputRef}
                  name="stock"
                  type="text"
                  value={formData.stock}
                  onChange={handleChange}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  placeholder="e.g. AAPL"
                  className="fintech-input w-full"
                  autoComplete="off"
                />

                {showDropdown && suggestions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
                  >
                    {suggestions.map((item) => (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={() => handleSuggestionClick(item.symbol)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-indigo-50"
                      >
                        <span className="min-w-[60px] font-semibold text-indigo-600">
                          {item.symbol}
                        </span>
                        <span className="text-sm text-slate-500">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-600">Investment Amount</span>
              <input
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 50000"
                className="fintech-input"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-600">Duration (Months)</span>
              <input
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 12"
                className="fintech-input"
              />
            </label>

            <button type="submit" disabled={loading} className="fintech-button mt-2">
              {loading ? 'Running...' : 'Run Simulation'}
            </button>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-500">
                {error}
              </div>
            ) : null}
          </form>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {resultCards.map((result) => (
              <div
                key={result.label}
                className="fintech-card animate-slide-up"
              >
                <p className="text-sm font-medium text-slate-500">{result.label}</p>
                <p className={`mt-3 text-3xl font-semibold ${loading ? 'animate-pulse text-slate-400' : result.tone}`}>
                  {result.value}
                </p>
              </div>
            ))}
          </div>

          <div className="fintech-card animate-slide-up">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Outcome Chart</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {loading
                    ? 'Crunching scenarios and building projections...'
                    : 'Best, worst, and average simulation values.'}
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                Risk: {results.risk || '--'}
              </div>
            </div>

            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
