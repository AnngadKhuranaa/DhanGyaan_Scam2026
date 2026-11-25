import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, ShieldAlert, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function AIInsightPopup({ isOpen, onClose, symbol, anchorRef }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !symbol) return;

    setLoading(true);
    setInsight(null);

    fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `Quick insight for ${symbol}: risk level, trend, recommendation in 2-3 sentences` }),
    })
      .then(r => r.json())
      .then(data => {
        setInsight({
          reply: data.reply || 'Insight unavailable.',
          visuals: data.visuals,
        });
      })
      .catch(() => {
        setInsight({ reply: 'AI insight is currently unavailable.', visuals: null });
      })
      .finally(() => setLoading(false));

    // Auto-close after 15s
    const timer = setTimeout(onClose, 15000);
    return () => clearTimeout(timer);
  }, [isOpen, symbol, onClose]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (isOpen) {
      // Delay to avoid immediately closing from the trigger click
      const timer = setTimeout(() => document.addEventListener('mousedown', handleClick), 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClick);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popupRef}
          initial={{ opacity: 0, scale: 0.9, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 8 }}
          transition={{ type: 'spring', damping: 22, stiffness: 400 }}
          className="fixed z-[60] w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
                <Sparkles size={14} className="text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">AI Insight</p>
                <p className="text-[10px] text-slate-400">{symbol}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors">
              <X size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2 py-2">
              <div className="skeleton-shimmer h-3 w-full rounded" />
              <div className="skeleton-shimmer h-3 w-4/5 rounded" />
              <div className="skeleton-shimmer h-3 w-3/5 rounded" />
            </div>
          ) : (
            <>
              {/* Visual badges */}
              {insight?.visuals && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {insight.visuals.trendArrow && (
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      insight.visuals.trendArrow === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {insight.visuals.trendArrow === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {insight.visuals.trendArrow === 'up' ? 'Upward' : 'Downward'}
                    </span>
                  )}
                  {insight.visuals.riskMeter && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      <ShieldAlert size={10} />
                      Risk: {insight.visuals.riskMeter}
                    </span>
                  )}
                  {insight.visuals.confidence && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                      {insight.visuals.confidence}
                    </span>
                  )}
                </div>
              )}
              
              <p className="text-xs leading-relaxed text-slate-600">{insight?.reply}</p>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
