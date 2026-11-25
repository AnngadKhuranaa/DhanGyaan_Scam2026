import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import SparklineChart, { generateSparklineData } from './SparklineChart';
import { useMemo } from 'react';

export default function StockCard({ stock, onClickSymbol, onClickAI, index = 0 }) {
  const { symbol, name, price, changePercent, volume } = stock;
  const isPositive = changePercent >= 0;

  const sparklineData = useMemo(
    () => generateSparklineData(price || 100, 20, isPositive ? 1 : -1),
    [price, isPositive]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(79, 70, 229, 0.1)' }}
      className="ripple-container group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200"
      onClick={() => onClickSymbol?.(symbol)}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Stock info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{symbol}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                isPositive
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isPositive ? '+' : ''}{changePercent?.toFixed(2)}%
            </span>
          </div>
          {name && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{name}</p>
          )}
          <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
            <span>₹{price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            {volume && <span>Vol: {(volume / 1000000).toFixed(1)}M</span>}
          </div>
        </div>

        {/* Middle: Sparkline */}
        <div className="w-20 shrink-0">
          <SparklineChart data={sparklineData} positive={isPositive} height={36} />
        </div>

        {/* Right: AI button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClickAI?.(symbol);
          }}
          className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-400 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 opacity-0 group-hover:opacity-100"
          title="AI Insight"
        >
          <Sparkles size={14} />
        </button>
      </div>
    </motion.div>
  );
}
