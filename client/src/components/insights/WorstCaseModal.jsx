import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, TrendingDown } from 'lucide-react';
import InsightPanel from '../InsightPanel';
import { formatCurrency, generateRiskInsight } from '../../utils/insights';

// ─── Worst case scenarios ────────────────────────────────────
const SCENARIOS = [
  { name: '2008 Financial Crisis', drop: -56, recovery: '4 years', desc: 'Global banking collapse. S&P 500 lost 56% from peak to trough.' },
  { name: 'COVID-19 Crash (2020)', drop: -34, recovery: '5 months', desc: 'Fastest 30%+ crash in history. V-shaped recovery fueled by stimulus.' },
  { name: 'Dot-com Bubble (2000)', drop: -49, recovery: '7 years', desc: 'Tech valuations imploded. NASDAQ lost 78% from peak.' },
  { name: 'Moderate Bear Market', drop: -25, recovery: '12-18 months', desc: 'Typical correction cycle. Driven by rate hikes or earnings slowdown.' },
  { name: 'Sector-specific Crash', drop: -40, recovery: '2-3 years', desc: 'Industry disruption or regulatory crackdown affecting a single sector.' },
];

function simulateWorstCase(amount, timePeriod, selectedScenario) {
  const scenario = SCENARIOS[selectedScenario];
  const dropPct = scenario.drop;
  const worstValue = Math.round(amount * (1 + dropPct / 100));
  const loss = amount - worstValue;

  // Value at Risk (5th percentile) — simplified
  const dailyVol = Math.abs(dropPct) / (252 * 0.5); // rough annualized
  const var95 = Math.round(amount * dailyVol * Math.sqrt(timePeriod * 252) * 1.65);

  // Maximum drawdown during the period
  const maxDrawdown = dropPct;

  return {
    scenario: scenario.name,
    scenarioDesc: scenario.desc,
    recovery: scenario.recovery,
    dropPct,
    worstValue,
    loss,
    var95: Math.min(var95, amount),
    maxDrawdown,
  };
}

export default function WorstCaseModal({ isOpen, onClose }) {
  const [amount, setAmount] = useState(500000);
  const [stock, setStock] = useState('NIFTY 50');
  const [years, setYears] = useState(3);
  const [scenario, setScenario] = useState(3); // default: moderate bear
  const [result, setResult] = useState(null);

  function runSimulation() {
    setResult(simulateWorstCase(amount, years, scenario));
  }

  if (!isOpen) return null;
  const fmt = (n) => formatCurrency(Math.abs(n));

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
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 md:p-8 shadow-2xl ring-1 ring-slate-200/50"
        >
          <button onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Worst Case Reality</h2>
              <p className="text-sm text-slate-500">What happens if the market crashes?</p>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Investment</span>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10" />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Stock / Index</span>
              <input type="text" value={stock} onChange={(e) => setStock(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Horizon</span>
              <div className="relative mt-1.5">
                <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">years</span>
              </div>
            </label>
          </div>

          {/* Scenario selector */}
          <label className="block mb-5">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Crash Scenario</span>
            <select value={scenario} onChange={(e) => setScenario(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10">
              {SCENARIOS.map((s, i) => (
                <option key={i} value={i}>{s.name} ({s.drop}%)</option>
              ))}
            </select>
          </label>

          <button onClick={runSimulation}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] mb-6">
            Simulate Crash
          </button>

          {/* Results */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Warning card */}
              <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-red-50/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown size={18} className="text-rose-500" />
                  <h3 className="font-bold text-rose-700">{result.scenario}</h3>
                </div>
                <p className="text-xs text-rose-600/80 mb-4">{result.scenarioDesc}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/80 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Your Investment</p>
                    <p className="text-lg font-bold text-slate-800 mt-1">{fmt(amount)}</p>
                  </div>
                  <div className="rounded-xl bg-rose-100/80 p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">Worst Case Value</p>
                    <p className="text-lg font-bold text-rose-700 mt-1">{fmt(result.worstValue)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white/60 p-3">
                  <p className="text-sm text-center font-medium text-rose-700">
                    If market crashes, your <strong>{fmt(amount)}</strong> → <strong>{fmt(result.worstValue)}</strong>
                  </p>
                  <p className="text-xs text-center text-rose-500 mt-1">
                    Potential loss: {fmt(result.loss)} ({result.dropPct}%) · Recovery: ~{result.recovery}
                  </p>
                </div>
              </div>

              {/* Additional metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Max Drawdown</p>
                  <p className="text-2xl font-bold text-rose-600 mt-1">{result.maxDrawdown}%</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Value at Risk (95%)</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{fmt(result.var95)}</p>
                </div>
              </div>

              {/* AI Insights */}
              <InsightPanel
                insights={generateRiskInsight({
                  dropPct: result.dropPct,
                  loss: result.loss,
                  recovery: result.recovery,
                  scenarioName: result.scenario,
                })}
                title="Risk Insights"
              />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
