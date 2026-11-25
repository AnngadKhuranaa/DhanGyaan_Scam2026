import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import useUIStore from '../store/useUIStore';

export default function MarketToggle() {
  const { marketMode, setMarketMode } = useUIStore();
  const isBull = marketMode === 'bull';

  return (
    <div className="flex items-center rounded-full border border-slate-200/80 bg-white/80 p-1 backdrop-blur-sm shadow-sm">
      {/* Bull button */}
      <button
        onClick={() => setMarketMode('bull')}
        className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
          isBull
            ? 'text-white'
            : 'text-slate-500 hover:text-emerald-600'
        }`}
      >
        {isBull && (
          <motion.div
            layoutId="market-toggle-bg"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/25"
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          />
        )}
        <span className="relative flex items-center gap-1.5">
          <TrendingUp size={12} />
          Bull
        </span>
      </button>

      {/* Bear button */}
      <button
        onClick={() => setMarketMode('bear')}
        className={`relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
          !isBull
            ? 'text-white'
            : 'text-slate-500 hover:text-rose-600'
        }`}
      >
        {!isBull && (
          <motion.div
            layoutId="market-toggle-bg"
            className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 to-red-500 shadow-md shadow-rose-500/25"
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          />
        )}
        <span className="relative flex items-center gap-1.5">
          <TrendingDown size={12} />
          Bear
        </span>
      </button>
    </div>
  );
}
