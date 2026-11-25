import { Info } from 'lucide-react';
import { insightsService } from '../../services';
import useAsync from '../../hooks/useAsync';
import { DemoBadge, ErrorState, SkeletonRows } from '../ui/States';

function labelBadge(label) {
  if (label === 'Favourable') return 'badge-gain';
  if (label === 'Weak') return 'badge-loss';
  return 'badge-warn';
}

/** Score bar: brand colour, since a confidence score isn't a gain or a loss. */
function Bar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, value ?? 0)}%` }} />
    </div>
  );
}

/**
 * Transparent confidence score: every component shows its 0-100 score, its
 * weight, its contribution to the total and the plain-English reason.
 */
export default function ConfidenceBreakdown({ symbol, compact = false }) {
  const { data, error, loading, reload } = useAsync(() => insightsService.confidence(symbol), [symbol]);

  if (loading) return <SkeletonRows rows={5} className="h-8" />;
  if (error) return <ErrorState error={error} onRetry={reload} title="Confidence score unavailable" compact />;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="muted text-xs font-medium uppercase tracking-wide">Confidence score</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-bold tabular">{data.score}</span>
            <span className="muted text-sm">/ 100</span>
            <span className={labelBadge(data.label)}>{data.label}</span>
          </p>
        </div>
        {data.sentimentDemo && <DemoBadge reason="Sentiment is sample data, so it's excluded from the score" />}
      </div>

      <ul className="mt-4 space-y-3">
        {data.components.map((c) => (
          <li key={c.key} className={c.included ? '' : 'opacity-70'}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                {c.label}{' '}
                <span className="muted text-xs">
                  {c.included ? `weight ${(c.effectiveWeight * 100).toFixed(1)}%` : 'excluded'}
                </span>
              </span>
              <span className="tabular">
                <span className="font-semibold">{c.score ?? '—'}</span>
                {c.included && <span className="muted text-xs"> → +{c.contribution}</span>}
              </span>
            </div>
            <Bar value={c.included ? c.score : 0} />
            {!compact && <p className="muted mt-1 text-xs">{c.explanation}</p>}
          </li>
        ))}
      </ul>

      <details className="mt-4 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
        <summary className="flex cursor-pointer items-center gap-1.5 font-medium">
          <Info size={13} aria-hidden="true" /> How is this calculated?
        </summary>
        <div className="muted mt-2 space-y-1">
          <p>{data.formula}.</p>
          <p>Trend: price vs 50-day average (±10% saturates) and 20-day vs 50-day average (±5%).</p>
          <p>Momentum: 3-month return, ±20% saturates. Volatility: 15% annualised scores 100, 60% scores 0.</p>
          <p>Sentiment: 50 + 50 × average headline score. Excluded when headlines are demo data.</p>
          <p>{data.disclaimer}</p>
        </div>
      </details>
    </div>
  );
}
