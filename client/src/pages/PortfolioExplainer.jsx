import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getPortfolio, explainPortfolio } from '../services/portfolioService';
import { formatINR } from '../utils/formatCurrency';
import toast from 'react-hot-toast';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

const COLORS = ['#14b88a', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];

export default function PortfolioExplainer() {
  const [portfolio, setPortfolio] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    getPortfolio().then((d) => setPortfolio(d.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleExplain = async () => {
    setAiLoading(true);
    try {
      const data = await explainPortfolio();
      setExplanation(data.data.explanation);
    } catch {
      toast.error('AI explanation failed. Check your API key.');
    } finally {
      setAiLoading(false);
    }
  };

  const pieData = portfolio?.holdings?.map((h) => ({
    name: h.symbol,
    value: +(h.currentPrice * h.quantity).toFixed(2),
  })) || [];

  if (loading) return <div className="glass-card p-10 text-center text-slate-400">Loading portfolio...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">🤖 AI Portfolio Explainer</h2>
          <p className="text-slate-400 text-sm">Gemini AI explains your portfolio in plain language</p>
        </div>
        <button id="ai-explain-btn" onClick={handleExplain} disabled={aiLoading || !portfolio?.holdings?.length} className="btn-primary disabled:opacity-60">
          {aiLoading ? '✨ Analyzing...' : '✨ Explain My Portfolio'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings Table */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-4">Holdings</h3>
          {portfolio?.holdings?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-left border-b border-white/5">
                    <th className="pb-2">Symbol</th><th className="pb-2">Qty</th><th className="pb-2">Avg</th><th className="pb-2">LTP</th><th className="pb-2">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {portfolio.holdings.map((h) => {
                    const pnl = (h.currentPrice - h.avgBuyPrice) * h.quantity;
                    return (
                      <tr key={h.symbol} className="text-slate-300">
                        <td className="py-2 font-medium text-white">{h.symbol}</td>
                        <td className="py-2">{h.quantity}</td>
                        <td className="py-2">{formatINR(h.avgBuyPrice)}</td>
                        <td className="py-2">{formatINR(h.currentPrice)}</td>
                        <td className={`py-2 font-semibold ${pnl >= 0 ? 'text-brand-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : ''}{formatINR(pnl)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : <p className="text-slate-500 text-sm">No holdings yet. Start paper trading!</p>}
        </div>

        {/* Donut Chart */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white mb-4">Allocation</h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm text-center mt-10">Add holdings to see allocation</p>}
        </div>
      </div>

      {/* AI Explanation Box */}
      {explanation && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 border-brand-500/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <h3 className="font-semibold text-brand-400">AI Analysis</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
