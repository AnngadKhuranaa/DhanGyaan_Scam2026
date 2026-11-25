import { useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, Play, TrendingDown, TrendingUp } from 'lucide-react';
import { simulate } from '../services/stockService';
import { formatINR } from '../utils/formatCurrency';
import toast from 'react-hot-toast';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

export default function RiskSandbox() {
  const [form, setForm] = useState({ symbol: 'AAPL', currentPrice: 180, mu: 0.12, sigma: 0.25, days: 252, simulations: 1000 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const data = await simulate(form);
      setResult(data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const chartData = result?.samplePaths?.[0]?.map((price, i) => ({ day: i, price })) || [];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <FlaskConical className="text-purple-400" size={28} />
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Risk Simulation Sandbox</h2>
          <p className="text-slate-400 text-sm">Monte Carlo simulation across 1,000+ price paths</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-white mb-2">Simulation Parameters</h3>
          {[
            { name: 'symbol',       label: 'Stock Symbol',       type: 'text',   placeholder: 'e.g. AAPL, RELIANCE.NS' },
            { name: 'currentPrice', label: 'Current Price (₹)',  type: 'number', placeholder: '180' },
            { name: 'mu',           label: 'Expected Return (e.g. 0.12 = 12%)', type: 'number', placeholder: '0.12' },
            { name: 'sigma',        label: 'Volatility (e.g. 0.25 = 25%)',      type: 'number', placeholder: '0.25' },
            { name: 'days',         label: 'Forecast Days',      type: 'number', placeholder: '252' },
            { name: 'simulations',  label: 'Simulations',        type: 'number', placeholder: '1000' },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="text-xs text-slate-400 mb-1 block">{label}</label>
              <input name={name} value={form[name]} onChange={handleChange} type={type} placeholder={placeholder} className="input-field text-sm py-2" />
            </div>
          ))}
          <button id="run-simulation" onClick={handleSimulate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
            <Play size={16} /> {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-5">
          {result ? (
            <>
              {/* Loss Probability Meter */}
              <div className="glass-card p-5">
                <p className="text-slate-400 text-sm mb-2">Loss Probability</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-white/10 rounded-full h-3">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${result.statistics.lossProbability > 50 ? 'bg-red-500' : result.statistics.lossProbability > 30 ? 'bg-yellow-500' : 'bg-brand-500'}`}
                      style={{ width: `${result.statistics.lossProbability}%` }}
                    />
                  </div>
                  <span className="text-xl font-bold font-display text-white">{result.statistics.lossProbability}%</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Probability that price falls below ₹{result.currentPrice} over {result.days} trading days</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Expected Return', value: `${result.statistics.expectedReturn}%`, icon: result.statistics.expectedReturn >= 0 ? TrendingUp : TrendingDown, color: result.statistics.expectedReturn >= 0 ? 'text-brand-400' : 'text-red-400' },
                  { label: 'Median Price',  value: formatINR(result.statistics.median), icon: null, color: 'text-white' },
                  { label: 'Best 5% (P95)', value: formatINR(result.statistics.p95),   icon: TrendingUp, color: 'text-emerald-400' },
                  { label: 'Worst 5% (P5)', value: formatINR(result.statistics.p5),    icon: TrendingDown, color: 'text-red-400' },
                  { label: 'VaR 95%',       value: formatINR(result.var95?.var),        icon: null, color: 'text-yellow-400' },
                  { label: 'VaR 99%',       value: formatINR(result.var99?.var),        icon: null, color: 'text-orange-400' },
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className="stat-card">
                    <p className="text-xs text-slate-400">{label}</p>
                    <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Chart — one sample path */}
              <div className="glass-card p-5">
                <p className="text-sm text-slate-400 mb-3">Sample Price Path (1 of {result.simulations})</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v.toFixed(0)}`} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(v) => [`₹${v}`, 'Price']} />
                    <Line type="monotone" dataKey="price" stroke="#14b88a" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-slate-500 h-full min-h-[300px]">
              <FlaskConical size={48} className="mb-4 text-purple-400/40" />
              <p>Configure parameters and click Run Simulation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
