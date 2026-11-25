import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Send, TrendingUp, TrendingDown,
  ShieldAlert, ShieldCheck, Shield, Zap,
  MessageSquare, Bot, User, BarChart3, Eye, Target
} from 'lucide-react';
import useUIStore from '../store/useUIStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ─── Risk badge styling ──────────────────────────────────────
const RISK_STYLES = {
  low:     { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: ShieldCheck, label: 'Low Risk' },
  medium:  { bg: 'bg-amber-100',   text: 'text-amber-700',   border: 'border-amber-200',   icon: Shield,      label: 'Medium Risk' },
  high:    { bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200',    icon: ShieldAlert,  label: 'High Risk' },
  unknown: { bg: 'bg-slate-100',   text: 'text-slate-600',   border: 'border-slate-200',   icon: Shield,       label: 'N/A' },
};

function getRisk(level) {
  return RISK_STYLES[(level || '').toLowerCase()] || RISK_STYLES.unknown;
}

// ─── Typewriter hook ─────────────────────────────────────────
function useTypewriter(text, speed = 10) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) { setDisplayed(''); setDone(true); return; }
    setDisplayed(''); setDone(false);
    let i = 0;
    const t = setInterval(() => {
      i += 2; // 2 chars at a time for speed
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); setDone(true); }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);

  return { displayed, done };
}

// ─── Stock Card (shown when stock detected) ──────────────────
function StockCard({ data }) {
  if (!data.stock) return null;

  const isPositive = data.change && !data.change.startsWith('-');
  const risk = getRisk(data.risk);
  const RiskIcon = risk.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white shadow-md">
            <BarChart3 size={18} />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{data.stock}</p>
            <p className="text-xs text-slate-500">{data.trend || 'Market Data'}</p>
          </div>
        </div>
        <div className="text-right">
          {data.price && <p className="text-xl font-bold text-slate-900">{data.price}</p>}
          {data.change && (
            <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {data.change}
            </div>
          )}
        </div>
      </div>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${risk.bg} ${risk.text} ${risk.border}`}>
          <RiskIcon size={10} />
          {risk.label}
        </span>
        {data.confidence && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
            <Zap size={10} />
            {data.confidence} confidence
          </span>
        )}
        {data.trend && (
          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
            data.trend === 'Bullish' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
            data.trend === 'Bearish' ? 'border-rose-200 bg-rose-50 text-rose-700' :
            'border-slate-200 bg-slate-50 text-slate-600'
          }`}>
            {data.trend === 'Bullish' ? <TrendingUp size={10} /> : data.trend === 'Bearish' ? <TrendingDown size={10} /> : <Target size={10} />}
            {data.trend}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── AI Message Bubble ───────────────────────────────────────
function AIBubble({ msg, isLatest }) {
  const isUser = msg.role === 'user';
  const summaryText = isLatest && !isUser ? msg.summary : null;
  const { displayed, done } = useTypewriter(summaryText, 8);

  const showSummary = isUser ? null : (isLatest ? displayed : msg.summary);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
        isUser
          ? 'bg-indigo-600 text-white'
          : 'bg-gradient-to-br from-brand-50 to-indigo-100 text-brand-600'
      }`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className={`max-w-[85%] space-y-2.5 ${isUser ? 'items-end' : ''}`}>
        {/* User bubble */}
        {isUser && (
          <div className="rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-white shadow-sm">
            <p className="text-sm leading-relaxed">{msg.content || msg.summary}</p>
            <p className="mt-1.5 text-right text-[10px] text-indigo-200">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}

        {/* AI bubble */}
        {!isUser && (
          <>
            {/* Stock Card */}
            {msg.stock && <StockCard data={msg} />}

            {/* Summary */}
            {showSummary && (
              <div className="rounded-2xl rounded-tl-sm border border-slate-200/60 bg-white/90 px-4 py-3.5 shadow-sm backdrop-blur-sm">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {showSummary}
                  {isLatest && !done && <span className="inline-block w-0.5 h-4 bg-brand-500 ml-0.5 animate-pulse" />}
                </p>
                <p className="mt-2 text-[10px] text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            {/* Reasoning (expandable) */}
            {!isUser && msg.reasoning && done && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-slate-200/50 bg-slate-50/80 px-4 py-3"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye size={12} className="text-slate-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">Reasoning</p>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">{msg.reasoning}</p>
              </motion.div>
            )}

            {/* Outlook */}
            {!isUser && msg.outlook && (msg.outlook.short_term || msg.outlook.long_term) && done && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid gap-2 sm:grid-cols-2"
              >
                {msg.outlook.short_term && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-400 mb-1">Short-Term</p>
                    <p className="text-xs leading-relaxed text-blue-700">{msg.outlook.short_term}</p>
                  </div>
                )}
                {msg.outlook.long_term && (
                  <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-3.5 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-400 mb-1">Long-Term</p>
                    <p className="text-xs leading-relaxed text-violet-700">{msg.outlook.long_term}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Insight box */}
            {!isUser && msg.insight && done && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-blue-50/40 px-3.5 py-2.5"
              >
                <div className="flex items-start gap-2">
                  <Sparkles size={12} className="mt-0.5 shrink-0 text-brand-500" />
                  <p className="text-xs font-medium leading-relaxed text-brand-700">{msg.insight}</p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function AIModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      summary: "Welcome to the AI Investment Terminal. I provide real-time stock analysis, risk evaluation, and market intelligence.\n\nTry asking about any stock — I'll pull live data and give you a structured breakdown.",
      timestamp: new Date().toISOString(),
      insight: 'Type a stock name or ticker to get started — e.g., "Analyze Tesla" or "NVDA outlook"',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState([
    'Analyze TSLA',
    'Is NVDA overvalued?',
    'AAPL risk analysis',
    'Compare MSFT vs GOOGL',
  ]);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSend = useCallback(async (preset = null) => {
    const text = preset || query;
    if (!text.trim() || loading) return;
    if (!preset) setQuery('');

    const userMsg = { role: 'user', summary: text, content: text, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Simulate thinking (300-700ms)
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

    try {
      const res = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          marketMode: useUIStore.getState().marketMode,
          history: messages.slice(-10).map((m) => ({
            role: m.role === 'ai' ? 'assistant' : m.role,
            content: m.summary || m.content || '',
          })),
        }),
      });

      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();

      const aiMsg = {
        role: 'ai',
        timestamp: new Date().toISOString(),
        // Structured fields from backend
        stock: data.stock || null,
        price: data.price || null,
        change: data.change || null,
        trend: data.trend || null,
        risk: data.risk || 'Medium',
        confidence: data.confidence || null,
        summary: data.summary || data.reply || 'Analysis could not be generated.',
        reasoning: data.reasoning || '',
        outlook: data.outlook || {},
        insight: data.insight || '',
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (data.suggestedFollowUps?.length > 0) {
        setFollowUps(data.suggestedFollowUps.slice(0, 4));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          summary: 'AI assistant is temporarily unavailable. Please check your connection and try again.',
          timestamp: new Date().toISOString(),
          risk: 'Unknown',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [query, loading, messages]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="ai-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4"
      >
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-2xl h-[740px] max-h-[92vh] flex flex-col rounded-3xl bg-gradient-to-b from-white via-white to-slate-50/90 shadow-2xl ring-1 ring-slate-200/50 overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-white/90 px-5 py-3.5 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">AI Investment Terminal</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-[10px] font-medium text-emerald-600">Live · Real-time data</p>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* ── Chat ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-hide">
            {messages.map((msg, idx) => (
              <AIBubble key={idx} msg={msg} isLatest={idx === messages.length - 1} />
            ))}

            {loading && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-indigo-100 text-brand-600">
                  <Bot size={14} />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-slate-200/60 bg-white/90 px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          animate={{ y: [0, -6, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          className="block h-2 w-2 rounded-full bg-brand-400"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-slate-500">AI is analyzing...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={endRef} />
          </div>

          {/* ── Input ── */}
          <div className="border-t border-slate-100 bg-white/90 px-5 py-3.5 backdrop-blur-sm shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-hide">
              {followUps.map((text, i) => (
                <motion.button
                  key={`${text}-${i}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSend(text)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-brand-200 hover:bg-brand-50 hover:text-brand-600 disabled:opacity-50"
                >
                  {text}
                </motion.button>
              ))}
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <MessageSquare size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about any stock, risk, or market trend..."
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10 disabled:opacity-60"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={loading || !query.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                <Send size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
