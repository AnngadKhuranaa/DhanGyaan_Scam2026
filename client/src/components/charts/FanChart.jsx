import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCompact, formatCurrency } from '../../utils/formatCurrency';

/**
 * Monte Carlo fan chart. Recharts stacks areas, so each band is drawn as the
 * DIFFERENCE between percentiles stacked on an invisible p5 base:
 *   base = p5 (transparent), then p5->p25, p25->p75 (darkest), p75->p95.
 * The median is a line on top; the dashed line is the amount invested.
 */
export default function FanChart({ fan, amount, currency }) {
  const data = fan.map((f) => ({
    day: f.day,
    base: f.p5,
    lowBand: f.p25 - f.p5,
    midBand: f.p75 - f.p25,
    highBand: f.p95 - f.p75,
    p5: f.p5,
    p25: f.p25,
    median: f.p50,
    p75: f.p75,
    p95: f.p95,
  }));

  // Fit the y-axis to the bands (the invisible stacked base would otherwise pull it down to 0).
  const lo = Math.min(amount, ...fan.map((f) => f.p5));
  const hi = Math.max(amount, ...fan.map((f) => f.p95));
  const pad = (hi - lo) * 0.06;
  const yDomain = [Math.max(0, lo - pad), hi + pad];
  const lastDay = fan[fan.length - 1].day;

  const renderTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-1 font-semibold">Day {d.day}</p>
        <p>95th pct: {formatCurrency(d.p95, currency, 0)}</p>
        <p>75th pct: {formatCurrency(d.p75, currency, 0)}</p>
        <p className="font-semibold">Median: {formatCurrency(d.median, currency, 0)}</p>
        <p>25th pct: {formatCurrency(d.p25, currency, 0)}</p>
        <p>5th pct: {formatCurrency(d.p5, currency, 0)}</p>
      </div>
    );
  };

  return (
    <div className="h-80 w-full" role="img" aria-label="Fan chart of simulated portfolio values over time">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
          <XAxis dataKey="day" type="number" domain={[0, lastDay]} tickCount={8} allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" label={{ value: 'Trading days', position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={70} tickFormatter={(v) => formatCompact(v, currency)} domain={yDomain} allowDataOverflow />
          <Tooltip content={renderTooltip} />
          <Area dataKey="base" stackId="fan" stroke="none" fill="transparent" baseValue={yDomain[0]} isAnimationActive={false} />
          <Area dataKey="lowBand" stackId="fan" stroke="none" fill="#6366f1" fillOpacity={0.15} isAnimationActive={false} />
          <Area dataKey="midBand" stackId="fan" stroke="none" fill="#6366f1" fillOpacity={0.35} isAnimationActive={false} />
          <Area dataKey="highBand" stackId="fan" stroke="none" fill="#6366f1" fillOpacity={0.15} isAnimationActive={false} />
          <Line dataKey="median" stroke="#4338ca" strokeWidth={2} dot={false} isAnimationActive={false} />
          <ReferenceLine y={amount} stroke="#64748b" strokeDasharray="5 4" label={{ value: 'Invested', position: 'insideTopLeft', fontSize: 11, fill: '#64748b' }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
