import { useNavigate } from 'react-router-dom';
import { Bot, LineChart, Star } from 'lucide-react';
import { marketService } from '../services';
import useAsync from '../hooks/useAsync';
import useUIStore from '../store/useUIStore';
import { useWatchlistStore } from '../store/watchlistStore';
import { formatCompact, formatCurrency, formatNumber } from '../utils/formatCurrency';
import { fromNow } from '../utils/formatDate';
import { Drawer } from './ui/Overlay';
import { ErrorState, SkeletonRows } from './ui/States';
import { PercentChange } from './ui/Values';
import PriceChart from './charts/PriceChart';
import ConfidenceBreakdown from './insights/ConfidenceBreakdown';
import SentimentPanel from './insights/SentimentPanel';

function Section({ title, children }) {
  return (
    <section className="border-t border-slate-200 py-5 dark:border-slate-800">
      <h3 className="card-title mb-3">{title}</h3>
      {children}
    </section>
  );
}

/** Everything about one stock: live quote, chart, confidence, news, actions. */
export default function StockDetailDrawer() {
  const symbol = useUIStore((s) => s.detailSymbol);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const openAI = useUIStore((s) => s.openAI);
  const navigate = useNavigate();
  const inWatchlist = useWatchlistStore((s) => s.items.some((i) => i.symbol === symbol));
  const { add, remove } = useWatchlistStore();
  const { data: q, error, loading, reload } = useAsync(() => marketService.quote(symbol), [symbol], { enabled: Boolean(symbol) });

  return (
    <Drawer open={Boolean(symbol)} onClose={closeDetail} title={symbol || ''} width="max-w-2xl">
      {loading && <SkeletonRows rows={6} />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {q && (
        <>
          <div className="pb-5">
            <p className="muted text-sm">{q.name} · {q.exchange}</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold tabular">{formatCurrency(q.price, q.currency)}</span>
              <PercentChange value={q.changePercent} className="text-base" />
            </div>
            <p className="muted mt-1 text-xs">
              {q.marketState === 'REGULAR' ? 'Market open' : 'Market closed, last traded price'} · updated {fromNow(q.asOf)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  closeDetail();
                  navigate(`/trade?symbol=${encodeURIComponent(q.symbol)}`);
                }}
              >
                <LineChart size={16} aria-hidden="true" /> Trade
              </button>
              <button type="button" className="btn-secondary" aria-pressed={inWatchlist} onClick={() => (inWatchlist ? remove(q.symbol) : add(q.symbol))}>
                <Star size={16} aria-hidden="true" className={inWatchlist ? 'fill-amber-400 text-amber-500' : ''} />
                {inWatchlist ? 'Watching' : 'Watch'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => openAI(q.symbol)}>
                <Bot size={16} aria-hidden="true" /> Ask AI
              </button>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {[
                ['Open', formatCurrency(q.open, q.currency)],
                ['Prev close', formatCurrency(q.previousClose, q.currency)],
                ['Day range', `${formatCurrency(q.dayLow, q.currency)} – ${formatCurrency(q.dayHigh, q.currency)}`],
                ['52-week range', `${formatCurrency(q.fiftyTwoWeekLow, q.currency)} – ${formatCurrency(q.fiftyTwoWeekHigh, q.currency)}`],
                ['Volume', formatNumber(q.volume)],
                ['Market cap', formatCompact(q.marketCap, q.currency)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="muted text-xs">{k}</dt>
                  <dd className="tabular font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Section title="Price history">
            <PriceChart symbol={q.symbol} height={260} />
          </Section>
          <Section title="Confidence breakdown">
            <ConfidenceBreakdown symbol={q.symbol} />
          </Section>
          <Section title="News sentiment">
            <SentimentPanel symbol={q.symbol} />
          </Section>
        </>
      )}
    </Drawer>
  );
}
