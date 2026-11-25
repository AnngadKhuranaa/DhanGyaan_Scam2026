import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import InsightPanel from '../InsightPanel';
import { formatCurrency, generatePortfolioInsight } from '../../utils/insights';

// ─── SIP / Lump-sum growth calculator ────────────────────────
function calculate(initial, monthly, rate, years) {
  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  const data = [];
  let invested = initial;
  let value = initial;

  data.push({ month: 0, year: 'Start', invested, value: Math.round(value) });

  for (let m = 1; m <= months; m++) {
    value = value * (1 + monthlyRate) + monthly;
    invested += monthly;

    if (m % 12 === 0 || m === months) {
      data.push({
        month: m,
        year: `Y${Math.ceil(m / 12)}`,
        invested: Math.round(invested),
        value: Math.round(value),
      });
    }
  }

  const totalInvested = invested;
  const totalValue = Math.round(value);
  const wealth = totalValue - totalInvested;
  const cagr = years > 0 ? ((Math.pow(totalValue / initial, 1 / years) - 1) * 100).toFixed(2) : 0;

  return { data, totalInvested, totalValue, wealth, cagr };
}

export default function TimeTableModal({ isOpen, onClose }) {
  const [initial, setInitial] = useState(100000);
  const [monthly, setMonthly] = useState(10000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const result = useMemo(
    () => calculate(initial, monthly, rate, years),
    [initial, monthly, rate, years]
  );

  if (!isOpen) return null;

  const fmt = (n) => formatCurrency(n);

  const insights = useMemo(
    () => generatePortfolioInsight({ totalInvested: result.totalInvested, totalValue: result.totalValue, cagr: result.cagr, years }),
    [result, years]
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
      >
        <div className="absolute inset-0" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl ring-1 ring-slate-200/50"
        >
          <button onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-md">
              <TrendingUp size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Time-table Portfolio</h2>
              <p className="text-sm text-slate-500">Visualize how your investment evolves over time</p>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {[
              { label: 'Initial Investment', value: initial, set: setInitial, prefix: '₹' },
              { label: 'Monthly SIP', value: monthly, set: setMonthly, prefix: '₹' },
              { label: 'Expected Return', value: rate, set: setRate, suffix: '%' },
              { label: 'Duration', value: years, set: setYears, suffix: 'years' },
            ].map((f) => (
              <label key={f.label} className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{f.label}</span>
                <div className="relative mt-1.5">
                  {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{f.prefix}</span>}
                  <input
                    type="number"
                    value={f.value}
                    onChange={(e) => f.set(Number(e.target.value) || 0)}
                    className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 ${f.prefix ? 'pl-8 pr-3' : 'px-3'}`}
                  />
                  {f.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{f.suffix}</span>}
                </div>
              </label>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 mb-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={result.data}>
                <defs>
                  <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  formatter={(v) => [fmt(v)]}
                />
                <Area type="monotone" dataKey="invested" stroke="#94a3b8" fill="url(#investedGrad)" strokeWidth={2} name="Invested" />
                <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#valueGrad)" strokeWidth={2} name="Portfolio Value" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Results */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Invested', value: fmt(result.totalInvested), color: 'text-slate-700' },
              { label: 'Portfolio Value', value: fmt(result.totalValue), color: 'text-indigo-600' },
              { label: 'Wealth Created', value: fmt(result.wealth), color: 'text-emerald-600' },
              { label: 'CAGR', value: `${result.cagr}%`, color: 'text-blue-600' },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">{c.label}</p>
                <p className={`mt-2 text-2xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* AI Insights */}
          <div className="mt-6">
            <InsightPanel insights={insights} title="Investment Insights" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
