import { ExternalLink, Newspaper } from 'lucide-react';
import { insightsService } from '../../services';
import useAsync from '../../hooks/useAsync';
import { formatDateTime, fromNow } from '../../utils/formatDate';
import { DemoBadge, EmptyState, ErrorState, SkeletonRows } from '../ui/States';

const badgeFor = (label) => (label === 'positive' ? 'badge-gain' : label === 'negative' ? 'badge-loss' : 'badge-neutral');

/** Headlines with their deterministic scores and the words that produced them. */
export default function SentimentPanel({ symbol, limit = 6 }) {
  const { data, error, loading, reload } = useAsync(() => insightsService.sentiment(symbol), [symbol]);

  if (loading) return <SkeletonRows rows={4} className="h-14" />;
  if (error) return <ErrorState error={error} onRetry={reload} title="News sentiment unavailable" compact />;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={badgeFor(data.label)}>{data.label}</span>
        <span className="tabular text-sm font-semibold">{data.score > 0 ? '+' : ''}{data.score.toFixed(2)}</span>
        <span className="muted text-xs">
          avg of {data.headlines.length} headline{data.headlines.length === 1 ? '' : 's'} (−1 to +1)
        </span>
        {data.demo && <DemoBadge reason={data.demoReason} />}
      </div>
      {data.demo && <p className="muted mb-3 text-xs">{data.demoReason}. These sample headlines only demonstrate the scorer.</p>}

      {data.headlines.length === 0 ? (
        <EmptyState icon={Newspaper} title="No recent headlines" message={`NewsAPI returned no headlines mentioning “${data.query}” in the last two weeks.`} />
      ) : (
        <ul className="space-y-2">
          {data.headlines.slice(0, limit).map((h) => (
            <li key={h.title} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">
                  {h.url ? (
                    <a href={h.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {h.title} <ExternalLink size={12} className="inline" aria-label="(opens in new tab)" />
                    </a>
                  ) : (
                    h.title
                  )}
                </p>
                <span className={`${badgeFor(h.label)} shrink-0`}>{h.score > 0 ? '+' : ''}{h.score.toFixed(2)}</span>
              </div>
              <p className="muted mt-1 text-xs">
                {h.source}
                {h.publishedAt && <span title={formatDateTime(h.publishedAt)}> · {fromNow(h.publishedAt)}</span>}
                {h.matched?.length > 0 && <span> · matched: {h.matched.join(', ')}</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
