import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, ArrowUpDown } from 'lucide-react';
import { useState } from 'react';
import Drawer from './Drawer';
import StockCard from './StockCard';

const CATEGORY_CONFIG = {
  gainers: {
    title: 'Top Gainers',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
    accentBg: 'bg-emerald-50',
    accentBorder: 'border-emerald-200',
  },
  losers: {
    title: 'Top Losers',
    icon: TrendingDown,
    iconColor: 'text-rose-500',
    accentBg: 'bg-rose-50',
    accentBorder: 'border-rose-200',
  },
  traded: {
    title: 'Most Traded',
    icon: BarChart3,
    iconColor: 'text-blue-500',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-blue-200',
  },
};

export default function CategoryDrawer({ isOpen, onClose, category, stocks, onClickSymbol, onClickAI }) {
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'change' | 'volume'

  if (!category || !CATEGORY_CONFIG[category]) return null;

  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  const sortedStocks = [...(stocks || [])].sort((a, b) => {
    if (sortBy === 'change') return Math.abs(b.changePercent) - Math.abs(a.changePercent);
    if (sortBy === 'volume') return (b.volume || 0) - (a.volume || 0);
    return 0; // default order from API
  });

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={config.title}>
      {/* Category Header */}
      <div className={`flex items-center gap-3 rounded-2xl ${config.accentBg} border ${config.accentBorder} p-4 mb-5`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm`}>
          <Icon size={20} className={config.iconColor} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{config.title}</p>
          <p className="text-xs text-slate-500">{sortedStocks.length} stocks</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2 mb-4">
        <ArrowUpDown size={12} className="text-slate-400" />
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Sort by</span>
        <div className="flex gap-1.5 ml-1">
          {[
            { key: 'default', label: 'Default' },
            { key: 'change', label: '% Change' },
            { key: 'volume', label: 'Volume' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                sortBy === opt.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock List */}
      <div className="space-y-2.5">
        {sortedStocks.map((stock, index) => (
          <StockCard
            key={stock.symbol}
            stock={stock}
            index={index}
            onClickSymbol={(sym) => {
              onClickSymbol?.(sym);
              onClose();
            }}
            onClickAI={(sym) => {
              onClickAI?.(sym);
            }}
          />
        ))}

        {sortedStocks.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center text-sm text-slate-400"
          >
            No data available.
          </motion.p>
        )}
      </div>
    </Drawer>
  );
}
