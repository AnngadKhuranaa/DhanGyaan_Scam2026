import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Search } from 'lucide-react';
import { getSentiment } from '../services/sentimentService';
import toast from 'react-hot-toast';

const labelColors = { BULLISH: 'badge-bullish', BEARISH: 'badge-bearish', NEUTRAL: 'badge-neutral' };
const labelEmoji  = { BULLISH: '🐂', BEARISH: '🐻', NEUTRAL: '⚖️' };

export default function LiveSentiment() {
  const [symbol, setSymbol]   = useState('');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const res = await getSentiment(symbol.toUpperCase());
      setData(res.data);
    } catch { toast.error('Failed to fetch sentiment data'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <Radio className="text-yellow-400" size={28} />
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Live Stock Sentiment</h2>
          <p className="text-slate-400 text-sm">Real-time Twitter + News sentiment analysis per stock</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-5 flex gap-3">
        <input id="sentiment-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Enter stock symbol (e.g. TSLA)" className="input-field flex-1" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        <button id="sentiment-search-btn" onClick={handleSearch} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          <Search size={16} />{loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {data && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Sentiment Header */}
          <div className="glass-card p-6 flex items-center gap-6">
            <div className="text-6xl">{labelEmoji[data.sentimentLabel]}</div>
            <div>
              <p className="text-slate-400 text-sm mb-1">{data.symbol} Sentiment</p>
              <span className={`${labelColors[data.sentimentLabel]} text-base px-4 py-1.5`}>{data.sentimentLabel}</span>
              <p className="text-slate-500 text-sm mt-2">Score: {data.sentimentScore} (−1 Bearish → +1 Bullish)</p>
            </div>

            {/* Score Bar */}
            <div className="flex-1 ml-4 hidden sm:block">
              <div className="h-3 bg-white/10 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-red-500/30 rounded-l-full" />
                  <div className="w-1/2 bg-brand-500/30 rounded-r-full" />
                </div>
                <div
                  className={`absolute top-0 h-full w-4 rounded-full ${data.sentimentScore >= 0 ? 'bg-brand-400' : 'bg-red-400'}`}
                  style={{ left: `calc(${((data.sentimentScore + 1) / 2) * 100}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Bearish</span><span>Neutral</span><span>Bullish</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Tweets */}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white mb-4">🐦 Recent Tweets</h3>
              {data.tweets?.length ? (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scroll">
                  {data.tweets.map((t, i) => (
                    <div key={i} className="p-3 glass-card text-sm">
                      <p className="text-slate-300 mb-2">{t.text}</p>
                      <span className={labelColors[t.sentiment] || 'badge-neutral'}>{t.sentiment}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm">No tweets found (requires Twitter API key)</p>}
            </div>

            {/* News */}
            <div className="glass-card p-5">
              <h3 className="font-semibold text-white mb-4">📰 News Headlines</h3>
              {data.news?.length ? (
                <div className="space-y-3 max-h-80 overflow-y-auto custom-scroll">
                  {data.news.map((n, i) => (
                    <div key={i} className="p-3 glass-card text-sm">
                      <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-slate-200 hover:text-brand-400 transition-colors font-medium">{n.title}</a>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-slate-500 text-xs">{n.source}</span>
                        <span className={labelColors[n.sentiment] || 'badge-neutral'}>{n.sentiment}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-500 text-sm">No news found (requires NewsAPI key)</p>}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
