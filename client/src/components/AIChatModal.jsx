import { useEffect, useRef, useState } from 'react';
import { Bot, Send, ShieldAlert, X } from 'lucide-react';
import { aiService } from '../services';
import { getErrorMessage } from '../lib/api';
import useUIStore from '../store/useUIStore';
import { Modal } from './ui/Overlay';
import StockSearch from './StockSearch';

const SUGGESTIONS = ['How risky is this stock for me?', 'Explain the confidence score in simple terms', 'What does the volatility number mean?'];

/**
 * AI tutor. The server injects real context (live quote, confidence
 * breakdown, the user's position) so answers cite actual numbers.
 */
export default function AIChatModal() {
  const { open, symbol: initialSymbol } = useUIStore((s) => s.ai);
  const closeAI = useUIStore((s) => s.closeAI);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSymbol(initialSymbol);
      setMessages([]);
      setInput('');
    }
  }, [open, initialSymbol]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, pending]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || pending) return;
    const history = messages.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    setMessages((m) => [...m, { role: 'user', content: message }]);
    setInput('');
    setPending(true);
    try {
      const res = await aiService.chat(message, symbol || undefined, history);
      setMessages((m) => [...m, { role: 'assistant', content: res.reply, provider: res.provider }]);
    } catch (error) {
      setMessages((m) => [...m, { role: 'assistant', content: getErrorMessage(error, 'The AI tutor is unavailable right now.'), error: true }]);
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={closeAI} title="AI investing tutor" size="max-w-2xl">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2 rounded-xl bg-warn-soft p-3 text-xs text-warn dark:bg-warn-dark-soft dark:text-warn-dark">
          <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>Educational only, not financial advice. Answers are generated from live market data and your paper portfolio and can be wrong.</p>
        </div>

        <div>
          <p className="label">Stock context (optional)</p>
          {symbol ? (
            <div className="flex items-center gap-2">
              <span className="badge-brand text-xs">{symbol}</span>
              <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setSymbol(null)} aria-label={`Remove ${symbol} context`}>
                <X size={13} /> Clear
              </button>
            </div>
          ) : (
            <StockSearch allMarkets onSelect={(s) => setSymbol(s.symbol)} placeholder="Pick a stock to discuss (optional)" />
          )}
        </div>

        <div className="min-h-[220px] space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/40" aria-live="polite">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="muted text-sm">Try asking:</p>
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="btn-secondary block w-full justify-start text-left font-normal">
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-brand-600 text-white dark:bg-brand-500 dark:text-slate-950'
                    : m.error
                      ? 'bg-loss-soft text-loss dark:bg-loss-dark-soft dark:text-loss-dark'
                      : 'bg-white text-slate-800 shadow-sm dark:bg-slate-800 dark:text-slate-100'
                }`}
              >
                {m.content}
                {m.provider && <p className="mt-1.5 text-2xs uppercase tracking-wide opacity-60">via {m.provider}</p>}
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex items-center gap-2 text-sm text-slate-500" role="status">
              <Bot size={16} className="animate-pulse" aria-hidden="true" /> Analysing live data…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="ai-input" className="sr-only">Your question</label>
          <input
            id="ai-input"
            className="input"
            value={input}
            maxLength={1000}
            onChange={(e) => setInput(e.target.value)}
            placeholder={symbol ? `Ask about ${symbol}…` : 'Ask about investing or your portfolio…'}
          />
          <button type="submit" className="btn-primary" disabled={pending || !input.trim()} aria-label="Send question">
            <Send size={16} />
          </button>
        </form>
      </div>
    </Modal>
  );
}
