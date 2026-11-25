import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DoorOpen, Target, ShieldAlert, TrendingUp, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import InsightPanel from '../InsightPanel';
import { generateExitInsight } from '../../utils/insights';

// ─── Exit strategy logic ─────────────────────────────────────
function computeExitStrategy(entryPrice, stock) {
  const entry = Number(entryPrice);
  if (!entry || entry <= 0) return null;

  // Support & resistance (mock logic based on entry price)
  const support1 = +(entry * 0.95).toFixed(2);
  const support2 = +(entry * 0.88).toFixed(2);
  const resistance1 = +(entry * 1.08).toFixed(2);
  const resistance2 = +(entry * 1.15).toFixed(2);

  // Stop loss (trailing 7% below entry)
  const stopLoss = +(entry * 0.93).toFixed(2);
  const stopLossPct = '-7%';

  // Target prices
  const target1 = +(entry * 1.12).toFixed(2);
  const target2 = +(entry * 1.25).toFixed(2);

  // Risk-reward ratio
  const risk = entry - stopLoss;
  const reward = target1 - entry;
  const rrRatio = (reward / risk).toFixed(1);

  // Suggestion logic
  const currentEstimate = entry * (0.97 + Math.random() * 0.08); // mock current
  const pctFromEntry = ((currentEstimate - entry) / entry) * 100;
  let suggestion, suggestionColor, SuggestionIcon;

  if (pctFromEntry > 10) {
    suggestion = 'Consider booking partial profits. Trail your stop loss to lock in gains.';
    suggestionColor = 'border-emerald-200 bg-emerald-50 text-emerald-700';
    SuggestionIcon = TrendingUp;
  } else if (pctFromEntry < -5) {
    suggestion = 'Approaching stop loss zone. Review your thesis — exit if fundamentals have changed.';
    suggestionColor = 'border-rose-200 bg-rose-50 text-rose-700';
    SuggestionIcon = ArrowDown;
  } else {
    suggestion = 'Position within range. Hold if your original thesis is intact. Monitor key levels.';
    suggestionColor = 'border-blue-200 bg-blue-50 text-blue-700';
    SuggestionIcon = Minus;
  }

  return {
    stock: stock.toUpperCase(),
    entry,
    stopLoss, stopLossPct,
    target1, target2,
    support1, support2,
    resistance1, resistance2,
    rrRatio,
    suggestion, suggestionColor, SuggestionIcon,
    currentEstimate: +currentEstimate.toFixed(2),
    pctFromEntry: pctFromEntry.toFixed(2),
  };
}

export default function ExitCoachModal({ isOpen, onClose }) {
  const [stock, setStock] = useState('TSLA');
  const [entryPrice, setEntryPrice] = useState(175);
  const [result, setResult] = useState(null);

  function analyze() {
    const r = computeExitStrategy(entryPrice, stock);
    setResult(r);
  }

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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md">
              <DoorOpen size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Smart Exit Coach</h2>
              <p className="text-sm text-slate-500">Know when to hold and when to fold</p>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Stock Symbol</span>
              <input type="text" value={stock} onChange={(e) => setStock(e.target.value.toUpperCase())}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm uppercase outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Entry Price</span>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
                <input type="number" value={entryPrice} onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10" />
              </div>
            </label>
          </div>

          <button onClick={analyze} disabled={!stock.trim() || !entryPrice}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] disabled:opacity-60 mb-6">
            Get Exit Strategy
          </button>

          {/* Results */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Suggestion card */}
              <div className={`flex items-start gap-3 rounded-2xl border-2 p-4 ${result.suggestionColor}`}>
                <result.SuggestionIcon size={20} className="mt-0.5 shrink-0" />
                <p className="text-sm font-medium leading-relaxed">{result.suggestion}</p>
              </div>

              {/* Key levels grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <ShieldAlert size={14} className="text-rose-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">Stop Loss</p>
                  </div>
                  <p className="text-xl font-bold text-rose-700">₹{result.stopLoss}</p>
                  <p className="text-xs text-rose-400 mt-0.5">{result.stopLossPct} from entry</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Target size={14} className="text-emerald-500" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Target 1</p>
                  </div>
                  <p className="text-xl font-bold text-emerald-700">₹{result.target1}</p>
                  <p className="text-xs text-emerald-400 mt-0.5">+12% from entry</p>
                </div>
              </div>

              {/* Support / Resistance */}
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 mb-3">Key Levels</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Resistance 2', price: result.resistance2, type: 'res' },
                    { label: 'Resistance 1', price: result.resistance1, type: 'res' },
                    { label: 'Entry Price', price: result.entry, type: 'entry' },
                    { label: 'Support 1', price: result.support1, type: 'sup' },
                    { label: 'Support 2', price: result.support2, type: 'sup' },
                  ].map((level) => (
                    <div key={level.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {level.type === 'res' && <ArrowUp size={12} className="text-emerald-500" />}
                        {level.type === 'sup' && <ArrowDown size={12} className="text-rose-500" />}
                        {level.type === 'entry' && <Minus size={12} className="text-blue-500" />}
                        <span className="text-xs font-medium text-slate-600">{level.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        level.type === 'entry' ? 'text-blue-600' :
                        level.type === 'res' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>₹{level.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk/Reward */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Risk : Reward</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">1 : {result.rrRatio}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 bg-white p-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Target 2</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">₹{result.target2}</p>
                  <p className="text-xs text-slate-400 mt-0.5">+25% stretch goal</p>
                </div>
              </div>

              {/* AI Insights */}
              <InsightPanel
                insights={generateExitInsight({
                  entry: result.entry,
                  stopLoss: result.stopLoss,
                  target1: result.target1,
                  rrRatio: result.rrRatio,
                })}
                title="Exit Strategy Insights"
              />
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
