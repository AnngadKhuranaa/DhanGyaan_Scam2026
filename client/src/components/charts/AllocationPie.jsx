import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatCurrency';

// Categorical palette (not green/red, which are reserved for gains/losses). Cash is always slate.
const COLORS = ['#4f46e5', '#0ea5e9', '#a855f7', '#f59e0b', '#14b8a6', '#ec4899', '#6366f1', '#84cc16', '#f97316'];
const CASH = '#94a3b8';

export default function AllocationPie({ allocation }) {
  const data = allocation.filter((a) => a.value > 0);
  const colorFor = (a, i) => (a.name === 'Cash' ? CASH : COLORS[i % COLORS.length]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="h-44 w-44 shrink-0" role="img" aria-label="Portfolio allocation chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="100%" paddingAngle={1} stroke="none" isAnimationActive={false}>
              {data.map((a, i) => (
                <Cell key={a.name} fill={colorFor(a, i)} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(v, 'INR', 0)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-[200px] flex-1 space-y-1.5 text-sm">
        {data.map((a, i) => (
          <li key={a.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorFor(a, i) }} aria-hidden="true" />
              <span className="truncate">{a.name}</span>
            </span>
            <span className="tabular muted">{a.percent.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
