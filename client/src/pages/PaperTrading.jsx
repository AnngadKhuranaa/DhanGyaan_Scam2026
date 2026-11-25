import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import { getQuote } from '../services/stockService';
import { buyStock, sellStock, getTradeHistory } from '../services/tradeService';
import { formatINR } from '../utils/formatCurrency';
import toast from 'react-hot-toast';

export default function PaperTrading() {
  const [symbol, setSymbol]     = useState('');
  const [quote, setQuote]       = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [histLoaded, setHistLoaded] = useState(false);

  const fetchQuote = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    try {
      const d = await getQuote(symbol.toUpperCase());
      setQuote(d.data);
    } catch { toast.error('Could not fetch quote. Check symbol.'); }
    finally { setLoading(false); }
  };

  const handleBuy = async () => {
    try {
      const res = await buyStock(symbol, +quantity);
      toast.success(res.message);
      loadHistory();
    } catch (err) { toast.error(err?.response?.data?.message || 'Buy failed'); }
  };

  const handleSell = async () => {
    try {
      const res = await sellStock(symbol, +quantity);
      toast.success(res.message);
      loadHistory();
    } catch (err) { toast.error(err?.response?.data?.message || 'Sell failed'); }
  };

  const loadHistory = async () => {
    const d = await getTradeHistory();
    setHistory(d.data);
    setHistLoaded(true);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2"><TrendingUp className="text-brand-400" size={28} /> Paper Trading</h2>
        <p className="text-slate-400 text-sm">Trade with ₹1,00,000 virtual cash — no real money involved</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Form */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-white">Place Order</h3>
          <div className="flex gap-2">
            <input id="trade-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="Symbol (e.g. INFY.NS)" className="input-field flex-1" onKeyDown={(e) => e.key === 'Enter' && fetchQuote()} />
            <button id="fetch-quote-btn" onClick={fetchQuote} disabled={loading} className="btn-secondary px-3">
              <Search size={18} />
            </button>
          </div>

          {quote && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Company</span>
                <span className="text-white text-sm font-medium">{quote.companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Price</span>
                <span className="text-white font-bold">{formatINR(quote.price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Change</span>
                <span className={`text-sm font-semibold ${quote.change >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                  {quote.change >= 0 ? '+' : ''}{quote.change?.toFixed(2)} ({quote.changePercent?.toFixed(2)}%)
                </span>
              </div>
            </motion.div>
          )}

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Quantity</label>
            <input id="trade-quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input-field" />
          </div>

          {quote && (
            <p className="text-xs text-slate-500">Estimated total: <span className="text-white font-medium">{formatINR(quote.price * quantity)}</span></p>
          )}

          <div className="flex gap-3 pt-1">
            <button id="buy-btn" onClick={handleBuy} disabled={!quote} className="btn-primary flex-1 disabled:opacity-40">Buy</button>
            <button id="sell-btn" onClick={handleSell} disabled={!quote} className="btn-danger flex-1 disabled:opacity-40">Sell</button>
          </div>
        </div>

        {/* Trade History */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Trade History</h3>
            <button onClick={loadHistory} className="text-xs text-brand-400 hover:underline">Refresh</button>
          </div>
          {histLoaded && history.length === 0 && <p className="text-slate-500 text-sm">No trades yet.</p>}
          {!histLoaded && <p className="text-slate-500 text-sm">Click Refresh to load history.</p>}
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scroll">
            {history.map((t) => (
              <div key={t._id} className="flex items-center justify-between p-3 glass-card text-sm">
                <div>
                  <span className={`font-semibold ${t.type === 'BUY' ? 'text-brand-400' : 'text-red-400'}`}>{t.type}</span>
                  <span className="text-slate-300 ml-2">{t.symbol}</span>
                  <span className="text-slate-500 ml-2">× {t.quantity}</span>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{formatINR(t.total)}</p>
                  <p className="text-slate-500 text-xs">@ {formatINR(t.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
