import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DoorOpen, Gauge, X } from 'lucide-react';
import { insightsService, tradeService } from '../services';
import useAsync from '../hooks/useAsync';
import { formatCompact, formatCurrency, formatPercent } from '../utils/formatCurrency';
import StockSearch from '../components/StockSearch';
import ConfidenceBreakdown from '../components/insights/ConfidenceBreakdown';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/States';

const TABS = [
  ['confidence', 'Confidence score'],
  ['exit', 'Exit coach'],
  ['sip', 'SIP calculator'],
  ['stress', 'Stress test'],
];

function SymbolPicker({ symbol, onChange }) {
  return symbol ? (
    <div className="flex items-center gap-2">
      <span className="badge-brand text-sm">{symbol}</span>
      <button type="button" className="icon-btn h-8 w-8" onClick={() => onChange(null)} aria-label="Choose a different stock"><X size={15} /></button>
    </div>
  ) : (
    <StockSearch allMarkets className="max-w-md" onSelect={(s) => onChange(s.symbol)} placeholder="Search any NSE or US stock" />
  );
}

function ConfidenceTool() {
  const [symbol, setSymbol] = useState(null);
  return (
    <div className="space-y-4">
      <SymbolPicker symbol={symbol} onChange={setSymbol} />
      {symbol ? (
        <ConfidenceBreakdown symbol={symbol} />
      ) : (
        <EmptyState icon={Gauge} title="Pick a stock" message="See how trend, momentum, volatility and news sentiment combine into one transparent 0–100 score." />
      )}
    </div>
  );
}

function ExitCoach() {
  const [symbol, setSymbol] = useState(null);
  const [entryInput, setEntryInput] = useState('');
  const [entry, setEntry] = useState(undefined);
  const plan = useAsync(() => insightsService.exitPlan(symbol, entry), [symbol, entry], { enabled: Boolean(symbol) });
  const p = plan.data;
  const tone = { positive: 'badge-gain', negative: 'badge-loss', warning: 'badge-warn', neutral: 'badge-neutral' };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <SymbolPicker symbol={symbol} onChange={(s) => { setSymbol(s); setEntry(undefined); setEntryInput(''); }} />
        {symbol && (
          <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); setEntry(Number(entryInput) > 0 ? Number(entryInput) : undefined); }}>
            <div>
              <label className="label" htmlFor="entry">Your entry price (optional)</label>
              <input id="entry" type="number" min="0" step="any" className="input w-44" value={entryInput} onChange={(e) => setEntryInput(e.target.value)} placeholder="Live price" />
            </div>
            <button type="submit" className="btn-secondary">Update</button>
          </form>
        )}
      </div>
      {!symbol && <EmptyState icon={DoorOpen} title="Plan an exit before you enter" message="Get a volatility-based stop-loss, 2R/3R targets and real support/resistance levels." />}
      {plan.loading && <SkeletonRows rows={4} />}
      {plan.error && <ErrorState error={plan.error} onRetry={plan.reload} compact />}
      {p && (
        <div className="space-y-4">
          <p className={`${tone[p.action.tone]} px-3 py-2 text-sm normal-case tracking-normal`}>{p.action.text}</p>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Entry', formatCurrency(p.entry, p.currency), null],
              ['Current', formatCurrency(p.current, p.currency), formatPercent(p.changeFromEntryPercent)],
              ['Stop loss', formatCurrency(p.stopLoss, p.currency), formatPercent(p.stopLossPercent)],
              ['Daily volatility', `${p.dailyVolatilityPercent}%`, null],
              ['Target 1 (2R)', formatCurrency(p.target1, p.currency), null],
              ['Target 2 (3R)', formatCurrency(p.target2, p.currency), null],
              ['Support 20d / 50d', `${formatCurrency(p.support.days20, p.currency)} / ${formatCurrency(p.support.days50, p.currency)}`, null],
              ['Resistance 20d / 50d', `${formatCurrency(p.resistance.days20, p.currency)} / ${formatCurrency(p.resistance.days50, p.currency)}`, null],
            ].map(([k, v, sub]) => (
              <div key={k} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <dt className="muted text-xs">{k}</dt>
                <dd className="tabular font-semibold">{v} {sub && <span className="muted text-xs font-normal">{sub}</span>}</dd>
              </div>
            ))}
          </dl>
          <p className="muted text-xs">Method: {p.method} These are rule-based levels for learning, not trade recommendations.</p>
        </div>
      )}
    </div>
  );
}

function SipCalculator() {
  const [v, setV] = useState({ initial: 100000, monthly: 10000, rate: 12, years: 10 });
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: Math.max(0, Number(e.target.value)) }));

  // Month-by-month compounding: value = value*(1 + r/12) + monthly contribution.
  const { rows, invested, value } = useMemo(() => {
    const r = v.rate / 100 / 12;
    let val = v.initial;
    let inv = v.initial;
    const out = [{ year: 0, invested: inv, value: val }];
    for (let m = 1; m <= Math.min(50, v.years) * 12; m += 1) {
      val = val * (1 + r) + v.monthly;
      inv += v.monthly;
      if (m % 12 === 0) out.push({ year: m / 12, invested: Math.round(inv), value: Math.round(val) });
    }
    return { rows: out, invested: inv, value: val };
  }, [v]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {[['initial', 'Lump sum (₹)'], ['monthly', 'Monthly SIP (₹)'], ['rate', 'Assumed return % / yr'], ['years', 'Years']].map(([k, l]) => (
          <div key={k}>
            <label className="label" htmlFor={`sip-${k}`}>{l}</label>
            <input id={`sip-${k}`} type="number" min="0" max={k === 'years' ? 50 : undefined} className="input" value={v[k]} onChange={set(k)} />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="muted text-xs">You invest</p><p className="tabular text-lg font-semibold">{formatCurrency(invested, 'INR', 0)}</p></div>
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="muted text-xs">Projected value</p><p className="tabular text-lg font-semibold">{formatCurrency(value, 'INR', 0)}</p></div>
        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"><p className="muted text-xs">Growth from compounding</p><p className="tabular text-lg font-semibold">{formatCurrency(value - invested, 'INR', 0)}</p></div>
      </div>
      <div className="h-64" role="img" aria-label="Projected value versus amount invested by year">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
            <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={70} tickFormatter={(x) => formatCompact(x, 'INR')} />
            <Tooltip formatter={(x) => formatCurrency(x, 'INR', 0)} labelFormatter={(y) => `Year ${y}`} />
            <Area dataKey="value" name="Projected value" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.25} isAnimationActive={false} />
            <Area dataKey="invested" name="Invested" stroke="#64748b" fill="#94a3b8" fillOpacity={0.2} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="muted text-xs">A constant assumed return is a simplification: real returns vary year to year (see the risk simulator for that). Not a guarantee.</p>
    </div>
  );
}

// Approximate historical peak-to-trough index declines (closing levels).
const SCENARIOS = [
  { name: 'Global Financial Crisis', period: 'Jan–Oct 2008', index: 'NIFTY 50', drawdown: -59.9 },
  { name: 'Global Financial Crisis', period: 'Oct 2007–Mar 2009', index: 'S&P 500', drawdown: -56.8 },
  { name: 'Dot-com crash', period: 'Mar 2000–Oct 2002', index: 'S&P 500', drawdown: -49.1 },
  { name: 'COVID-19 crash', period: 'Jan–Mar 2020', index: 'NIFTY 50', drawdown: -38.4 },
  { name: 'COVID-19 crash', period: 'Feb–Mar 2020', index: 'S&P 500', drawdown: -33.9 },
];

function StressTest() {
  const portfolio = useAsync(() => tradeService.portfolio(), []);
  const [amount, setAmount] = useState('');
  const invested = portfolio.data?.holdingsValue || 0;
  const base = amount === '' ? invested || 100000 : Math.max(0, Number(amount));

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <label className="label" htmlFor="stress-amount">Amount exposed to the market (₹)</label>
        <input id="stress-amount" type="number" min="0" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(invested || 100000)} />
        <p className="muted mt-1 text-xs">{invested ? `Defaults to your current holdings value (${formatCurrency(invested, 'INR', 0)}).` : 'Defaults to ₹1,00,000.'}</p>
      </div>
      <div className="-mx-2 overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr><th scope="col">Scenario</th><th scope="col">Index & period</th><th scope="col" className="text-right">Decline</th><th scope="col" className="text-right">Your amount at the bottom</th><th scope="col" className="text-right">Loss</th></tr>
          </thead>
          <tbody>
            {SCENARIOS.map((s) => {
              const bottom = base * (1 + s.drawdown / 100);
              return (
                <tr key={`${s.name}-${s.index}`}>
                  <td className="font-medium">{s.name}</td>
                  <td className="muted">{s.index} · {s.period}</td>
                  <td className="tabular text-loss-c text-right">{formatPercent(s.drawdown, 1)}</td>
                  <td className="tabular text-right">{formatCurrency(bottom, 'INR', 0)}</td>
                  <td className="tabular text-loss-c text-right">{formatCurrency(base - bottom, 'INR', 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted text-xs">
        Declines are approximate historical peak-to-trough falls of broad indices. A single stock can fall far more than an index, and
        markets have historically recovered over periods ranging from months to years.
      </p>
    </div>
  );
}

export default function Insights() {
  const [tab, setTab] = useState('confidence');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">Tools that explain risk using real prices and published formulas.</p>
      </div>
      <div className="tab-list flex-wrap" role="tablist" aria-label="Insight tools">
        {TABS.map(([k, l]) => (
          <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`panel-${k}`} onClick={() => setTab(k)} className={`tab ${tab === k ? 'tab-active' : ''}`}>
            {l}
          </button>
        ))}
      </div>
      <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="card">
        {tab === 'confidence' && <ConfidenceTool />}
        {tab === 'exit' && <ExitCoach />}
        {tab === 'sip' && <SipCalculator />}
        {tab === 'stress' && <StressTest />}
      </section>
    </div>
  );
}
