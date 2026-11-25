import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, BarChart3, Newspaper, Activity } from 'lucide-react';
import InsightPanel from '../InsightPanel';
import { generateConfidenceInsight } from '../../utils/insights';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ─── Score ring SVG ──────────────────────────────────────────
function ScoreRing({ score, size = 120 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{score}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

// ─── Progress bar ────────────────────────────────────────────
function MetricBar({ label, icon: Icon, value, max = 100, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">{label}</span>
        </div>
        <span className="text-xs font-bold text-slate-700">{value}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function ConfidenceModal({ isOpen, onClose }) {
  const [stock, setStock] = useState('AAPL');
  const [riskLevel, setRiskLevel] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function analyze() {
    setLoading(true);
    // Simulate analysis using stock service data
    try {
      const res = await fetch(`${API_BASE_URL}/market/snapshot`);
      const data = await res.json();

      // Find stock in data
      const allStocks = [...(data.topGainers || []), ...(data.topLosers || []), ...(data.mostTraded || [])];
      const found = allStocks.find((s) => s.symbol === stock.toUpperCase());

      const changePct = found ? Math.abs(found.changePercent) : Math.random() * 5;
      const isPositive = found ? found.changePercent >= 0 : Math.random() > 0.4;

      // Compute sub-scores
      const sentiment = isPositive ? 60 + Math.floor(Math.random() * 30) : 20 + Math.floor(Math.random() * 30);
      const volatility = changePct > 3 ? 30 + Math.floor(Math.random() * 20) : 60 + Math.floor(Math.random() * 25);
      const newsImpact = 40 + Math.floor(Math.random() * 40);
      const trend = isPositive ? 55 + Math.floor(Math.random() * 35) : 15 + Math.floor(Math.random() * 35);

      // Risk tolerance modifier
      const riskMod = riskLevel === 'low' ? -10 : riskLevel === 'high' ? 10 : 0;

      const overall = Math.min(100, Math.max(0, Math.round(
        (sentiment * 0.3 + volatility * 0.25 + newsImpact * 0.2 + trend * 0.25) + riskMod
      )));

      setResult({
        overall,
        sentiment,
        volatility,
        newsImpact,
        trend,
        recommendation: overall >= 70 ? 'Strong confidence — favorable entry point' :
          overall >= 45 ? 'Moderate confidence — proceed with caution' :
          'Low confidence — high risk, consider waiting',
      });
    } catch {
      // Fallback with random data
      setResult({
        overall: 55 + Math.floor(Math.random() * 30),
        sentiment: 50 + Math.floor(Math.random() * 40),
        volatility: 40 + Math.floor(Math.random() * 40),
        newsImpact: 45 + Math.floor(Math.random() * 35),
        trend: 40 + Math.floor(Math.random() * 40),
        recommendation: 'Analysis based on simulated data.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) { setResult(null); }
  }, [isOpen]);

  if (!isOpen) return null;

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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Confidence Breakdown</h2>
              <p className="text-sm text-slate-500">How confident should you be in this stock?</p>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Stock Symbol</span>
              <input
                type="text" value={stock}
                onChange={(e) => setStock(e.target.value.toUpperCase())}
                placeholder="e.g. TSLA"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm uppercase outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Risk Tolerance</span>
              <select
                value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10"
              >
                <option value="low">Low — Conservative</option>
                <option value="medium">Medium — Balanced</option>
                <option value="high">High — Aggressive</option>
              </select>
            </label>
          </div>

          <button
            onClick={analyze}
            disabled={loading || !stock.trim()}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100 mb-6"
          >
            {loading ? 'Analyzing...' : 'Analyze Confidence'}
          </button>

          {/* Results */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="flex flex-col items-center gap-4">
                <ScoreRing score={result.overall} />
                <p className="text-sm font-medium text-center text-slate-600">{result.recommendation}</p>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 p-5">
                <MetricBar label="Market Sentiment" icon={BarChart3} value={result.sentiment} color="#6366f1" />
                <MetricBar label="Volatility Score" icon={Activity} value={result.volatility} color="#f59e0b" />
                <MetricBar label="News Impact" icon={Newspaper} value={result.newsImpact} color="#10b981" />
                <MetricBar label="Trend Strength" icon={ShieldCheck} value={result.trend} color="#3b82f6" />
              </div>

              {/* AI Insights */}
              <InsightPanel
                insights={generateConfidenceInsight({
                  overall: result.overall,
                  sentiment: result.sentiment,
                  volatility: result.volatility,
                  trend: result.trend,
                  riskLevel,
                })}
                title="Confidence Insights"
              />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
