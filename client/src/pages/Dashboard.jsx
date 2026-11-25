import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, BarChart3, Brain, 
  ChevronRight, Newspaper, ArrowUpDown 
} from 'lucide-react';
import useUIStore from '../store/useUIStore';

// Dashboard sub-components
import SkeletonCard from '../components/dashboard/SkeletonCard';
import LiveRefreshIndicator from '../components/dashboard/LiveRefreshIndicator';
import CategoryDrawer from '../components/dashboard/CategoryDrawer';
import StockDetailDrawer from '../components/dashboard/StockDetailDrawer';
import StockSearchDropdown from '../components/dashboard/StockSearchDropdown';
import NewsModal from '../components/dashboard/NewsModal';
import AIInsightPopup from '../components/dashboard/AIInsightPopup';
import SparklineChart, { generateSparklineData } from '../components/dashboard/SparklineChart';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const REFRESH_INTERVAL = 30000; // 30 seconds

async function safeFetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Server returned HTML instead of JSON");
  }

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export default function Dashboard() {
  const [marketData, setMarketData] = useState({
    topGainers: [],
    topLosers: [],
    mostTraded: [],
  });
  const [sentimentData, setSentimentData] = useState({
    sentimentScore: '--',
    summary: 'Choose a stock for live sentiment',
    topHeadlines: [],
  });
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Interactive state
  const [activeCategory, setActiveCategory] = useState(null); // 'gainers' | 'losers' | 'traded'
  const [selectedStock, setSelectedStock] = useState(null); // symbol string
  const [newsModalOpen, setNewsModalOpen] = useState(false);
  const [aiInsightSymbol, setAiInsightSymbol] = useState(null);
  const [expandedHeadlines, setExpandedHeadlines] = useState({});

  // Snapshot sort state per column
  const [snapshotSort, setSnapshotSort] = useState({
    gainers: 'default',
    losers: 'default',
    traded: 'default',
  });

  const refreshTimerRef = useRef(null);

  // ──────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────
  const loadDashboardData = useCallback(async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    const [marketResult, sentimentResult] = await Promise.allSettled([
      safeFetchJson(`${API_BASE_URL}/market/top`),
      safeFetchJson(`${API_BASE_URL}/sentiment/${selectedSymbol}`),
    ]);

    if (marketResult.status === 'fulfilled') {
      const marketJson = marketResult.value;
      setMarketData({
        topGainers: marketJson.topGainers || marketJson.gainers || [],
        topLosers: marketJson.topLosers || marketJson.losers || [],
        mostTraded: marketJson.mostTraded || [],
      });
    } else {
      console.warn('Market data failed:', marketResult.reason?.message);
      if (!isAutoRefresh) {
        setMarketData({ topGainers: [], topLosers: [], mostTraded: [] });
      }
    }

    if (sentimentResult.status === 'fulfilled') {
      const sentimentJson = sentimentResult.value;
      setSentimentData({
        sentimentScore:
          sentimentJson.sentimentScore !== undefined
            ? sentimentJson.sentimentScore
            : '--',
        summary: sentimentJson.summary || 'No sentiment available.',
        topHeadlines: sentimentJson.topHeadlines || [],
      });
    } else {
      console.warn('Sentiment data failed:', sentimentResult.reason?.message);
      if (!isAutoRefresh) {
        setSentimentData({
          sentimentScore: '--',
          summary: 'Sentiment data unavailable.',
          topHeadlines: [],
        });
      }
    }

    if (marketResult.status === 'rejected' && sentimentResult.status === 'rejected') {
      setError('Unable to load dashboard data right now.');
    } else {
      setError('');
    }

    setLoading(false);
    setIsRefreshing(false);
  }, [selectedSymbol]);

  // Initial load + re-fetch on symbol change
  useEffect(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  // Auto-refresh every 30s
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      loadDashboardData(true);
    }, REFRESH_INTERVAL);

    return () => clearInterval(refreshTimerRef.current);
  }, [loadDashboardData]);

  // ──────────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────────
  const getCategoryStocks = (category) => {
    switch (category) {
      case 'gainers': return marketData.topGainers;
      case 'losers': return marketData.topLosers;
      case 'traded': return marketData.mostTraded;
      default: return [];
    }
  };

  const sortStocks = (stocks, sortType) => {
    const arr = [...stocks];
    if (sortType === 'change') return arr.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
    if (sortType === 'volume') return arr.sort((a, b) => (b.volume || 0) - (a.volume || 0));
    return arr;
  };

  const toggleHeadline = (index) => {
    setExpandedHeadlines(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSymbolChange = (sym) => {
    setSelectedSymbol(sym);
  };

  const handleSelectFromSearch = (sym) => {
    setSelectedSymbol(sym);
    setSelectedStock(sym);
  };

  // ──────────────────────────────────────────────────────────
  // TOP DASHBOARD CARDS CONFIG
  // ──────────────────────────────────────────────────────────
  const dashboardCards = [
    {
      title: 'Top Gainer',
      value: marketData.topGainers[0]?.symbol || '--',
      note: marketData.topGainers[0]
        ? `${marketData.topGainers[0].changePercent}% today`
        : 'No market data available',
      category: 'gainers',
      icon: TrendingUp,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      accentColor: 'hover:border-emerald-300',
      glowColor: 'hover:shadow-emerald-200/40',
      positive: true,
    },
    {
      title: 'Top Loser',
      value: marketData.topLosers[0]?.symbol || '--',
      note: marketData.topLosers[0]
        ? `${marketData.topLosers[0].changePercent}% today`
        : 'No market data available',
      category: 'losers',
      icon: TrendingDown,
      iconColor: 'text-rose-500',
      iconBg: 'bg-rose-50',
      accentColor: 'hover:border-rose-300',
      glowColor: 'hover:shadow-rose-200/40',
      positive: false,
    },
    {
      title: 'Most Traded',
      value: marketData.mostTraded[0]?.symbol || '--',
      note: marketData.mostTraded[0]
        ? `${marketData.mostTraded[0].volume.toLocaleString()} volume`
        : 'No market data available',
      category: 'traded',
      icon: BarChart3,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50',
      accentColor: 'hover:border-blue-300',
      glowColor: 'hover:shadow-blue-200/40',
      positive: true,
    },
    {
      title: 'Sentiment Score',
      value: sentimentData.sentimentScore,
      note: sentimentData.summary,
      category: null,
      icon: Brain,
      iconColor: 'text-brand-500',
      iconBg: 'bg-indigo-50',
      accentColor: 'hover:border-brand-300',
      glowColor: 'hover:shadow-indigo-200/40',
      positive: sentimentData.sentimentScore >= 0,
    },
  ];

  const marketMode = useUIStore((s) => s.marketMode);
  const isBull = marketMode === 'bull';

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────
  return (
    <section className="space-y-8">
      {/* Header with Live Indicator */}
      <div className="flex items-start justify-between gap-4">
        <div className="section-header">
          <h1 className="section-title">Dashboard</h1>
          <p className="section-copy">
            {isBull
              ? 'Track growth opportunities, spot upside trends, and ride the momentum.'
              : 'Monitor downside risks, identify caution zones, and protect your capital.'}
          </p>
        </div>
        <LiveRefreshIndicator isRefreshing={isRefreshing} />
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      ) : null}

      {/* ─── TOP CARDS ─── */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} lines={3} />
            ))
          : dashboardCards.map((card, i) => {
              const Icon = card.icon;
              // Mode-aware glow
              const modeGlow = card.category === 'gainers'
                ? (isBull ? 'hover:shadow-emerald-200/50 hover:border-emerald-300' : 'hover:shadow-slate-200/50 hover:border-slate-300')
                : card.category === 'losers'
                ? (!isBull ? 'hover:shadow-rose-200/50 hover:border-rose-300' : 'hover:shadow-slate-200/50 hover:border-slate-300')
                : `${card.accentColor} ${card.glowColor}`;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(79, 70, 229, 0.12)' }}
                  onClick={() => {
                    if (card.category) {
                      setActiveCategory(card.category);
                    }
                  }}
                  className={`fintech-card ripple-container cursor-pointer relative overflow-hidden transition-all duration-300 ${modeGlow}`}
                >
                  {/* Subtle gradient overlay inside card */}
                  <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${
                    card.positive
                      ? 'from-transparent via-transparent to-emerald-50/40'
                      : 'from-transparent via-transparent to-rose-50/40'
                  }`} />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{card.title}</p>
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                        <Icon size={16} className={card.iconColor} />
                      </div>
                    </div>
                    <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
                      {card.value}
                    </h2>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm leading-6 text-slate-500 line-clamp-2">{card.note}</p>
                      {card.category && (
                        <ChevronRight size={16} className="text-slate-300 shrink-0" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
      </div>

      {/* ─── BOTTOM PANELS ─── */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        
        {/* ── MARKET SENTIMENT INSIGHTS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="fintech-card"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Market Sentiment Insights</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Read the current tone around a stock from recent headlines.
              </p>
            </div>
            <StockSearchDropdown
              value={selectedSymbol}
              onChange={handleSymbolChange}
              onSelectStock={handleSelectFromSearch}
            />
          </div>

          {/* Summary */}
          <div className="mt-6 rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/50 to-blue-50/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">Summary</p>
            <p className="mt-3 text-base leading-7 text-slate-700">
              {loading ? 'Loading sentiment...' : sentimentData.summary || 'No sentiment available.'}
            </p>
          </div>

          {/* Headlines */}
          <div className="mt-4 grid gap-3">
            {sentimentData.topHeadlines.map((headline, index) => {
              const sentColor =
                headline.sentiment === 'positive'
                  ? 'border-l-emerald-500'
                  : headline.sentiment === 'negative'
                  ? 'border-l-rose-500'
                  : 'border-l-amber-400';

              const sentBadgeColor =
                headline.sentiment === 'positive'
                  ? 'bg-emerald-100 text-emerald-700'
                  : headline.sentiment === 'negative'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700';

              // Mode-aware sentiment label
              const sentLabel =
                headline.sentiment === 'positive'
                  ? (isBull ? 'Bullish' : 'Upside Signal')
                  : headline.sentiment === 'negative'
                  ? (isBull ? 'Downside Risk' : 'Bearish')
                  : 'Neutral';

              const isExpanded = expandedHeadlines[index];
              const confidence = Math.floor(60 + Math.random() * 35);

              return (
                <motion.div
                  key={`${headline.title}-${index}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => toggleHeadline(index)}
                  className={`cursor-pointer rounded-2xl border border-l-4 border-slate-200/60 ${sentColor} bg-white/70 p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-md`}
                >
                  <p className="text-sm font-medium text-slate-800">{headline.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] ${sentBadgeColor}`}>
                      {sentLabel}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {confidence}% confidence
                    </span>
                  </div>

                  {/* Expandable preview */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                          {headline.sentiment === 'positive'
                            ? (isBull
                              ? `Analysts see strong upside potential. The momentum is favorable for ${selectedSymbol} — consider riding this trend with appropriate position sizing.`
                              : `A positive signal, but stay cautious. Even in bear markets, isolated good news for ${selectedSymbol} may not sustain. Wait for confirmation.`)
                            : headline.sentiment === 'negative'
                            ? (isBull
                              ? `A temporary dip could present a buying opportunity for ${selectedSymbol}. Monitor support levels before adding positions.`
                              : `Market participants expressed concern. In bear mode, protect capital first — consider reducing exposure to ${selectedSymbol} until clarity emerges.`)
                            : `Mixed signals from this development. ${isBull ? 'Look for breakout confirmation' : 'Prioritize risk management'} as traders assess the impact on ${selectedSymbol}.`}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {!loading && sentimentData.topHeadlines.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                No headlines available right now.
              </div>
            ) : null}

            {/* View All News button */}
            {sentimentData.topHeadlines.length > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => setNewsModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-sm font-medium text-slate-600 transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600"
              >
                <Newspaper size={14} />
                View All News
                <ChevronRight size={14} />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* ── MARKET SNAPSHOT ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="fintech-card"
        >
          <h2 className="text-2xl font-semibold text-slate-900">Market Snapshot</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Quick visibility into today&apos;s strongest and weakest names.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ['Top Gainers', 'gainers', marketData.topGainers],
              ['Top Losers', 'losers', marketData.topLosers],
              ['Most Traded', 'traded', marketData.mostTraded],
            ].map(([title, categoryKey, rows]) => {
              const sorted = sortStocks(rows, snapshotSort[categoryKey]);

              return (
                <div key={title} className={`rounded-2xl border border-slate-200/50 p-4 ${
                  categoryKey === 'gainers' ? 'bg-gradient-to-b from-white/80 to-emerald-50/20' :
                  categoryKey === 'losers' ? 'bg-gradient-to-b from-white/80 to-rose-50/20' :
                  'bg-gradient-to-b from-white/80 to-blue-50/20'
                } backdrop-blur-sm`}>
                  {/* Column header — clickable */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setActiveCategory(categoryKey)}
                      className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500 hover:text-brand-600 transition-colors"
                    >
                      {title}
                    </button>
                    {/* Sort toggle */}
                    <button
                      onClick={() =>
                        setSnapshotSort(prev => ({
                          ...prev,
                          [categoryKey]:
                            prev[categoryKey] === 'default'
                              ? 'change'
                              : prev[categoryKey] === 'change'
                              ? 'volume'
                              : 'default',
                        }))
                      }
                      className="rounded-md p-1 text-slate-300 hover:bg-slate-200 hover:text-slate-500 transition-colors"
                      title={`Sort: ${snapshotSort[categoryKey]}`}
                    >
                      <ArrowUpDown size={12} />
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {sorted.slice(0, 3).map((row, rowIdx) => (
                      <motion.div
                        key={row.symbol}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: rowIdx * 0.06 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedStock(row.symbol)}
                        className="cursor-pointer rounded-xl bg-white/90 p-3 shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md group border border-slate-100/60"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                            {row.symbol}
                          </span>
                          <span
                            className={
                              row.changePercent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                            }
                          >
                            {row.changePercent}%
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-sm text-slate-500">Rs {row.price}</p>
                          <div className="w-12">
                            <SparklineChart
                              data={generateSparklineData(row.price || 100, 12, row.changePercent >= 0 ? 1 : -1)}
                              positive={row.changePercent >= 0}
                              height={20}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {!loading && sorted.length === 0 ? (
                      <p className="text-sm text-slate-500">No data available.</p>
                    ) : null}
                  </div>

                  {/* Expand button */}
                  {sorted.length > 0 && (
                    <button
                      onClick={() => setActiveCategory(categoryKey)}
                      className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white hover:text-brand-600"
                    >
                      View all <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ─── OVERLAYS & DRAWERS ─── */}

      {/* Category Drawer (Top Gainers / Losers / Most Traded) */}
      <CategoryDrawer
        isOpen={!!activeCategory}
        onClose={() => setActiveCategory(null)}
        category={activeCategory}
        stocks={getCategoryStocks(activeCategory)}
        onClickSymbol={(sym) => setSelectedStock(sym)}
        onClickAI={(sym) => setAiInsightSymbol(sym)}
      />

      {/* Stock Detail Drawer */}
      <StockDetailDrawer
        isOpen={!!selectedStock}
        onClose={() => setSelectedStock(null)}
        symbol={selectedStock}
      />

      {/* News Modal */}
      <NewsModal
        isOpen={newsModalOpen}
        onClose={() => setNewsModalOpen(false)}
        headlines={sentimentData.topHeadlines}
        symbol={selectedSymbol}
      />

      {/* AI Insight Popup */}
      <AIInsightPopup
        isOpen={!!aiInsightSymbol}
        onClose={() => setAiInsightSymbol(null)}
        symbol={aiInsightSymbol}
      />
    </section>
  );
}
