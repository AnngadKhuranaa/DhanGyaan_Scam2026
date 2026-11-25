import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Construction, X, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ─── Validate MongoDB ObjectId (24-char hex string) ─────────
function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

// ─── Coming Soon Modal ──────────────────────────────────────
function ComingSoonModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="coming-soon-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
      >
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-200/50 text-center"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/20">
            <Construction size={28} />
          </div>

          <h3 className="mt-5 text-xl font-bold text-slate-900">Portfolio Under Development</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            Full portfolio tracking, P&L analytics, and holdings management will be available soon. We're building something exceptional.
          </p>

          <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <p className="text-xs text-indigo-600">
              <strong>Tip:</strong> Enter a valid 24-character MongoDB ObjectId to test existing portfolio data.
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-xl"
          >
            Got it
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Toast notification ─────────────────────────────────────
function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3 shadow-lg"
    >
      <AlertCircle size={16} className="shrink-0 text-rose-500" />
      <p className="text-sm font-medium text-rose-700">{message}</p>
      <button onClick={onClose} className="ml-2 rounded-full p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function Portfolio() {
  const [userId, setUserId] = useState(() => localStorage.getItem('portfolioUserId') || '');
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [toast, setToast] = useState('');

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    // Don't do anything if empty
    if (!userId.trim()) {
      setPortfolioData(null);
      setError('');
      return;
    }

    // VALIDATION: check for valid ObjectId BEFORE calling API
    if (!isValidObjectId(userId.trim())) {
      // If user typed something but it's not a valid ObjectId → show Coming Soon
      setPortfolioData(null);
      setError('');
      setShowComingSoon(true);
      return;
    }

    localStorage.setItem('portfolioUserId', userId);

    async function loadPortfolio() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${API_BASE_URL}/portfolio?userId=${encodeURIComponent(userId.trim())}`
        );
        const text = await response.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Server returned an unexpected response');
        }

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load portfolio');
        }

        setPortfolioData(data);
      } catch (requestError) {
        // Graceful error toast instead of ugly error box
        setToast('Portfolio data unavailable. Please try again later.');
        setPortfolioData(null);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, [userId]);

  const summaryCards = [
    ['Cash Balance', portfolioData?.balance],
    ['Total Value', portfolioData?.totalValue],
    ['Unrealized PnL', portfolioData?.unrealizedPnL],
    ['Realized PnL', portfolioData?.realizedPnL],
  ];

  return (
    <section className="space-y-8">
      <div className="section-header">
        <h1 className="section-title">Portfolio</h1>
        <p className="section-copy">
          Monitor your investments, track performance, and analyze profit and risk in real time.
        </p>
      </div>

      <div className="fintech-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <label className="grid flex-1 gap-2">
            <span className="text-sm font-medium text-slate-600">User ID</span>
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Enter 24-character MongoDB ObjectId"
              className="fintech-input"
            />
          </label>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${
            loading
              ? 'border-blue-200 bg-blue-50 text-blue-600'
              : userId && isValidObjectId(userId.trim())
              ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
              : 'border-slate-200 bg-slate-50 text-slate-500'
          }`}>
            {loading ? 'Loading portfolio...' : userId && isValidObjectId(userId.trim()) ? 'Valid ID · Connected' : 'Enter a valid user ID'}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-500">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(([label, value]) => (
          <div key={label} className="fintech-card">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {value !== undefined && value !== null ? `₹${value}` : '--'}
            </p>
          </div>
        ))}
      </div>

      <div className="fintech-card">
        <h2 className="text-2xl font-semibold text-slate-900">Holdings</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Live holdings and mark-to-market values from the backend portfolio API.
        </p>

        <div className="table-shell mt-6">
          <div className="table-head grid grid-cols-5 px-4 py-3">
            <span>Stock</span>
            <span>Quantity</span>
            <span>Avg Price</span>
            <span>Current Price</span>
            <span>PnL</span>
          </div>
          <div className="divide-y divide-slate-200">
            {(portfolioData?.holdings || []).map((holding) => (
              <div key={holding.name} className="table-row grid grid-cols-5 px-4 py-3">
                <span>{holding.name}</span>
                <span>{holding.quantity}</span>
                <span>₹{holding.avgPrice}</span>
                <span>₹{holding.currentPrice}</span>
                <span className={holding.pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  ₹{holding.pnl}
                </span>
              </div>
            ))}
            {!loading && (portfolioData?.holdings || []).length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                No holdings found for this user yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
      />

      {/* Error Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </AnimatePresence>
    </section>
  );
}
