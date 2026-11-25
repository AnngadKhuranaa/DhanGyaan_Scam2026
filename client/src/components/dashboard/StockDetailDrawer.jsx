import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, ShieldCheck, ShieldAlert, 
  Newspaper, BarChart3, Sparkles 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Drawer from './Drawer';
import { SkeletonRow } from './SkeletonCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function getRiskLevel(volatility) {
  if (volatility > 35) return { label: 'High', color: 'bg-rose-100 text-rose-700 border-rose-200' };
  if (volatility > 20) return { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { label: 'Low', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
}

function SentimentBar({ score }) {
  // Score ranges from -1 (bearish) to +1 (bullish)
  const normalized = ((score + 1) / 2) * 100; // 0-100%

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-rose-500">Sell</span>
        <span className="text-slate-400">Neutral</span>
        <span className="text-emerald-500">Buy</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${normalized}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #f43f5e 0%, #f59e0b 40%, #10b981 100%)`,
            backgroundSize: '300% 100%',
            backgroundPosition: `${100 - normalized}% 0`,
          }}
        />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold text-slate-900">₹{payload[0].value?.toLocaleString('en-IN')}</p>
      </div>
    );
  }
  return null;
}

export default function StockDetailDrawer({ isOpen, onClose, symbol }) {
  const [stockData, setStockData] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !symbol) return;

    setLoading(true);
    setStockData(null);
    setSentimentData(null);
    setAiSummary('');

    // Fetch stock + sentiment data in parallel
    Promise.allSettled([
      fetch(`${API_BASE_URL}/stocks/${symbol}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/sentiment/${symbol}`).then(r => r.json()),
    ]).then(([stockResult, sentimentResult]) => {
      if (stockResult.status === 'fulfilled') setStockData(stockResult.value);
      if (sentimentResult.status === 'fulfilled') setSentimentData(sentimentResult.value);
      setLoading(false);
    });
  }, [isOpen, symbol]);

  // Fetch AI summary separately (slower)
  useEffect(() => {
    if (!isOpen || !symbol) return;

    setAiLoading(true);
    fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Quick analysis for ${symbol}` }),
    })
      .then(r => r.json())
      .then(data => setAiSummary(data.reply || ''))
      .catch(() => setAiSummary('AI analysis unavailable.'))
      .finally(() => setAiLoading(false));
  }, [isOpen, symbol]);

  const chartData = useMemo(() => {
    if (!stockData?.history) return [];
    return stockData.history.slice(-60).map((item, i) => ({
      date: i,
      price: item.close,
    }));
  }, [stockData]);

  const risk = stockData ? getRiskLevel(stockData.volatility || 0) : null;
  const isPositive = stockData?.returns >= 0;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={symbol || 'Stock Detail'} width="max-w-lg">
      {loading ? (
        <div className="space-y-4">
          <SkeletonRow />
          <div className="skeleton-shimmer h-48 rounded-2xl" />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Price Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end justify-between"
          >
            <div>
              <h3 className="text-3xl font-bold text-slate-900">
                ₹{stockData?.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                {isPositive ? (
                  <TrendingUp size={14} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={14} className="text-rose-500" />
                )}
                <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isPositive ? '+' : ''}{stockData?.returns?.toFixed(2)}% returns
                </span>
              </div>
            </div>
            {risk && (
              <div className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${risk.color}`}>
                <ShieldCheck size={10} className="inline mr-1" />
                {risk.label} Risk
              </div>
            )}
          </motion.div>

          {/* Price Chart */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">60-Day Price Chart</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? '#10b981' : '#f43f5e'}
                  strokeWidth={2}
                  fill={`url(#grad-${symbol})`}
                  isAnimationActive
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Risk & Volatility */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Volatility</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{stockData?.volatility?.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Returns</p>
              <p className={`mt-1 text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositive ? '+' : ''}{stockData?.returns?.toFixed(2)}%
              </p>
            </div>
          </motion.div>

          {/* Buy/Sell Sentiment */}
          {sentimentData && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Buy / Sell Sentiment</p>
              <SentimentBar score={sentimentData.sentimentScore || 0} />
            </motion.div>
          )}

          {/* AI Summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50/50 to-blue-50/50 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-brand-500" />
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">AI Analysis</span>
            </div>
            {aiLoading ? (
              <div className="space-y-2">
                <div className="skeleton-shimmer h-3 w-full rounded" />
                <div className="skeleton-shimmer h-3 w-4/5 rounded" />
                <div className="skeleton-shimmer h-3 w-3/5 rounded" />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-slate-700">{aiSummary}</p>
            )}
          </motion.div>

          {/* News Headlines */}
          {sentimentData?.topHeadlines?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Newspaper size={14} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest News</span>
              </div>
              <div className="space-y-2">
                {sentimentData.topHeadlines.map((headline, i) => {
                  const sentColor =
                    headline.sentiment === 'positive'
                      ? 'border-l-emerald-500'
                      : headline.sentiment === 'negative'
                      ? 'border-l-rose-500'
                      : 'border-l-slate-300';

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                      className={`rounded-xl border border-slate-200 border-l-4 ${sentColor} bg-white p-3`}
                    >
                      <p className="text-sm font-medium text-slate-800">{headline.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{headline.source}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          headline.sentiment === 'positive' ? 'text-emerald-600' :
                          headline.sentiment === 'negative' ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                          {headline.sentiment}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </Drawer>
  );
}
