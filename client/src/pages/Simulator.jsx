import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FlaskConical, Repeat, X } from 'lucide-react';
import { insightsService } from '../services';
import { simulationSchema } from '../lib/schemas';
import { formatCurrency, formatPercent } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import StockSearch from '../components/StockSearch';
import FanChart from '../components/charts/FanChart';
import Field from '../components/ui/Field';
import { EmptyState, ErrorState, SkeletonRows, Spinner } from '../components/ui/States';
import { Stat } from '../components/ui/Values';

const HORIZONS = [
  [21, '1 month'],
  [63, '3 months'],
  [126, '6 months'],
  [252, '1 year'],
  [504, '2 years'],
  [756, '3 years'],
];

const riskBadge = (level) => (level === 'Low' ? 'badge-gain' : level === 'High' ? 'badge-loss' : 'badge-warn');

function Results({ r, onRerun, rerunning }) {
  const amount = r.inputs.amount;
  const pctOf = (v) => formatPercent(((v - amount) / amount) * 100);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold">{r.symbol} · {r.inputs.horizonDays} trading days · {r.inputs.paths.toLocaleString()} paths</h2>
        <span className={riskBadge(r.riskLevel)}>{r.riskLevel} risk</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Best case (95th percentile)" value={formatCurrency(r.outcomes.best, 'INR', 0)} sub={<span className="text-gain-c">{pctOf(r.outcomes.best)}</span>} />
        <Stat label="Median outcome" value={formatCurrency(r.outcomes.median, 'INR', 0)} sub={<span className={r.outcomes.median >= amount ? 'text-gain-c' : 'text-loss-c'}>{pctOf(r.outcomes.median)}</span>} />
        <Stat label="Worst case (5th percentile)" value={formatCurrency(r.outcomes.worst, 'INR', 0)} sub={<span className="text-loss-c">{pctOf(r.outcomes.worst)}</span>} />
        <Stat label="Probability of loss" value={`${r.probabilityOfLoss.toFixed(1)}%`} sub={<span className="muted">of paths end below {formatCurrency(amount, 'INR', 0)}</span>} />
        <Stat label="Value at Risk (95%)" value={formatCurrency(r.var95, 'INR', 0)} sub={<span className="muted">{r.var95Percent.toFixed(1)}% of the amount: only 5% of paths lose more</span>} />
        <Stat label="Expected shortfall (CVaR 95%)" value={formatCurrency(r.cvar95, 'INR', 0)} sub={<span className="muted">average loss in the worst 5% of paths</span>} />
      </div>

      <section className="card">
        <h3 className="card-title">Simulated value over time</h3>
        <p className="muted mb-3 text-xs">Darkest band: middle 50% of paths (25th–75th pct). Light bands: out to the 5th and 95th percentiles. Line: median.</p>
        <FanChart fan={r.fan} amount={amount} currency="INR" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h3 className="card-title mb-3">Calibration (real data)</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="muted text-xs">Daily returns used</dt><dd className="tabular font-medium">{r.calibration.observations}</dd></div>
            <div><dt className="muted text-xs">Window</dt><dd className="font-medium">{formatDate(r.calibration.from)} – {formatDate(r.calibration.to)}</dd></div>
            <div><dt className="muted text-xs">Annualised return (μ)</dt><dd className="tabular font-medium">{formatPercent(r.calibration.annualizedReturnPercent)}</dd></div>
            <div><dt className="muted text-xs">Annualised volatility (σ)</dt><dd className="tabular font-medium">{r.calibration.annualizedVolatilityPercent.toFixed(2)}%</dd></div>
            <div><dt className="muted text-xs">Daily mean log return</dt><dd className="tabular font-medium">{r.calibration.dailyMeanLogReturn.toFixed(5)}</dd></div>
            <div><dt className="muted text-xs">Daily σ</dt><dd className="tabular font-medium">{r.calibration.dailyVolatility.toFixed(5)}</dd></div>
          </dl>
          <p className="muted mt-4 font-mono text-xs">Vₜ₊₁ = Vₜ · exp(m + s·Z), Z ~ N(0,1)</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="muted">Seed {r.inputs.seed}</span>
            <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={onRerun} disabled={rerunning}>
              <Repeat size={13} aria-hidden="true" /> Re-run with same seed
            </button>
          </div>
        </section>
        <section className="card">
          <h3 className="card-title mb-3">Assumptions & limits</h3>
          <ul className="muted list-disc space-y-1.5 pl-5 text-sm">
            {r.assumptions.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function Simulator() {
  const [state, setState] = useState({ loading: false, result: null, error: null, lastPayload: null });
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(simulationSchema),
    defaultValues: { symbol: '', amount: 100000, horizonDays: 252, paths: 2000, lookback: '2y' },
  });

  const run = async (payload) => {
    setState((s) => ({ ...s, loading: true, error: null, lastPayload: payload }));
    try {
      const result = await insightsService.simulate(payload);
      setState({ loading: false, result, error: null, lastPayload: payload });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Risk simulator</h1>
        <p className="page-subtitle">
          A Monte Carlo simulation using geometric Brownian motion, calibrated on the stock’s real daily returns. See the range of
          outcomes, not just one forecast.
        </p>
      </div>

      <form onSubmit={handleSubmit(run)} className="card grid gap-4 md:grid-cols-2 lg:grid-cols-6" noValidate>
        <div className="md:col-span-2">
          <span className="label">Stock</span>
          <Controller
            control={control}
            name="symbol"
            render={({ field }) =>
              field.value ? (
                <div className="flex h-[42px] items-center gap-2">
                  <span className="badge-brand text-sm">{field.value}</span>
                  <button type="button" className="icon-btn h-8 w-8" onClick={() => field.onChange('')} aria-label="Change stock"><X size={15} /></button>
                </div>
              ) : (
                <StockSearch allMarkets onSelect={(s) => field.onChange(s.symbol)} placeholder="e.g. RELIANCE.NS or AAPL" />
              )
            }
          />
          {errors.symbol && <p className="field-error">{errors.symbol.message}</p>}
        </div>
        <Field label="Amount (₹)" type="number" inputMode="decimal" min={1000} error={errors.amount?.message} {...register('amount')} />
        <div>
          <label className="label" htmlFor="horizon">Horizon</label>
          <select id="horizon" className="input" {...register('horizonDays')}>
            {HORIZONS.map(([d, l]) => <option key={d} value={d}>{l} ({d} days)</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="paths">Paths</label>
          <select id="paths" className="input" {...register('paths')}>
            {[500, 1000, 2000, 5000, 10000].map((p) => <option key={p} value={p}>{p.toLocaleString()}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="lookback">Calibration</label>
          <select id="lookback" className="input" {...register('lookback')}>
            <option value="1y">Last 1 year</option>
            <option value="2y">Last 2 years</option>
          </select>
        </div>
        <div className="flex items-end md:col-span-2 lg:col-span-6">
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={state.loading}>
            {state.loading ? <Spinner size={14} /> : <FlaskConical size={16} aria-hidden="true" />} Run simulation
          </button>
        </div>
      </form>

      {state.error && <div className="card"><ErrorState error={state.error} onRetry={() => run(state.lastPayload)} title="Simulation failed" /></div>}
      {state.loading && !state.result && <div className="card"><SkeletonRows rows={6} className="h-12" /></div>}
      {!state.loading && !state.result && !state.error && (
        <div className="card">
          <EmptyState icon={FlaskConical} title="Run your first simulation" message="Pick a stock and an amount. We’ll simulate thousands of possible futures from its real price behaviour." />
        </div>
      )}
      {state.result && (
        <div className={state.loading ? 'opacity-60' : ''}>
          <Results r={state.result} rerunning={state.loading} onRerun={() => run({ ...state.lastPayload, seed: state.result.inputs.seed })} />
        </div>
      )}
    </div>
  );
}
