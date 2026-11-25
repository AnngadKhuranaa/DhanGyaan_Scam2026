import { useSearchParams } from 'react-router-dom';
import { Bot, LineChart, Star } from 'lucide-react';
import { marketService, tradeService } from '../services';
import useAsync from '../hooks/useAsync';
import useUIStore from '../store/useUIStore';
import { useWatchlistStore } from '../store/watchlistStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDateTime, fromNow } from '../utils/formatDate';
import StockSearch from '../components/StockSearch';
import TradeTicket from '../components/TradeTicket';
import PriceChart from '../components/charts/PriceChart';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/States';
import { PercentChange, SignedMoney } from '../components/ui/Values';

const POPULAR = { IN: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS'], US: ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'TSLA'] };

function Position({ symbol, portfolio }) {
  const h = portfolio?.holdings.find((x) => x.symbol === symbol);
  return (
    <div className="card">
      <h2 className="card-title mb-3">Your position</h2>
      {!h ? (
        <p className="muted text-sm">You don’t hold {symbol} yet.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="muted text-xs">Shares</dt><dd className="tabular font-semibold">{h.quantity}</dd></div>
          <div><dt className="muted text-xs">Avg price</dt><dd className="tabular font-semibold">{formatCurrency(h.avgPrice, h.currency)}</dd></div>
          <div><dt className="muted text-xs">Market value</dt><dd className="tabular font-semibold">{formatCurrency(h.marketValueInr, 'INR')}</dd></div>
          <div><dt className="muted text-xs">Unrealised P&L</dt><dd><SignedMoney value={h.unrealizedPnL} /> <PercentChange value={h.unrealizedPnLPercent} className="text-xs" /></dd></div>
        </dl>
      )}
    </div>
  );
}

function RecentTrades({ symbol, trades, loading }) {
  return (
    <div className="card">
      <h2 className="card-title mb-3">Your recent {symbol} trades</h2>
      {loading && <SkeletonRows rows={3} className="h-8" />}
      {!loading && (!trades || trades.items.length === 0) && <p className="muted text-sm">No trades in {symbol} yet.</p>}
      {!loading && trades?.items.length > 0 && (
        <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {trades.items.map((t) => (
            <li key={t._id} className="flex items-center justify-between gap-2 py-2">
              <span>
                <span className={t.side === 'BUY' ? 'badge-gain' : 'badge-loss'}>{t.side}</span>{' '}
                <span className="tabular">{t.quantity} @ {formatCurrency(t.price, t.currency)}</span>
              </span>
              <span className="muted text-xs" title={formatDateTime(t.createdAt)}>{fromNow(t.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Trade() {
  const [params, setParams] = useSearchParams();
  const symbol = params.get('symbol')?.toUpperCase() || null;
  const market = useUIStore((s) => s.market);
  const openAI = useUIStore((s) => s.openAI);
  const watching = useWatchlistStore((s) => s.items.some((i) => i.symbol === symbol));
  const { add, remove } = useWatchlistStore();

  const quote = useAsync(() => marketService.quote(symbol), [symbol], { enabled: Boolean(symbol) });
  const portfolio = useAsync(() => tradeService.portfolio(), [symbol], { enabled: Boolean(symbol), keepPreviousData: true });
  const trades = useAsync(() => tradeService.history({ symbol, limit: 5 }), [symbol], { enabled: Boolean(symbol), keepPreviousData: true });

  const pick = (s) => setParams({ symbol: s });
  const held = portfolio.data?.holdings.find((h) => h.symbol === symbol)?.quantity || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Trade</h1>
          <p className="page-subtitle">Buy and sell with virtual money at live market prices.</p>
        </div>
        <StockSearch className="w-full sm:w-80" onSelect={(s) => pick(s.symbol)} placeholder="Search a stock to trade" />
      </div>

      {!symbol && (
        <div className="card">
          <EmptyState
            icon={LineChart}
            title="Pick a stock to trade"
            message="Search above, or start with one of these popular stocks."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {POPULAR[market].map((s) => (
                  <button key={s} type="button" className="btn-secondary px-3 py-1.5" onClick={() => pick(s)}>{s.replace('.NS', '')}</button>
                ))}
              </div>
            }
          />
        </div>
      )}

      {symbol && quote.loading && <div className="card"><SkeletonRows rows={6} /></div>}
      {symbol && quote.error && <div className="card"><ErrorState error={quote.error} onRetry={quote.reload} /></div>}

      {quote.data && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="muted text-sm">{quote.data.name} · {quote.data.exchange}</p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-bold tabular">{formatCurrency(quote.data.price, quote.data.currency)}</span>
                    <PercentChange value={quote.data.changePercent} className="text-base" />
                  </div>
                  <p className="muted mt-1 text-xs">
                    {quote.data.marketState === 'REGULAR' ? 'Market open' : 'Market closed: orders fill at the last traded price'} · {fromNow(quote.data.asOf)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" aria-pressed={watching} onClick={() => (watching ? remove(symbol) : add(symbol))}>
                    <Star size={16} aria-hidden="true" className={watching ? 'fill-amber-400 text-amber-500' : ''} /> {watching ? 'Watching' : 'Watch'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => openAI(symbol)}>
                    <Bot size={16} aria-hidden="true" /> Ask AI
                  </button>
                </div>
              </div>
              <div className="mt-5"><PriceChart symbol={symbol} /></div>
            </div>
          </div>

          <div className="space-y-6">
            <TradeTicket
              quote={quote.data}
              heldQuantity={held}
              onExecuted={() => {
                portfolio.reload();
                trades.reload();
              }}
            />
            {portfolio.error ? (
              <div className="card"><ErrorState error={portfolio.error} onRetry={portfolio.reload} compact /></div>
            ) : (
              <Position symbol={symbol} portfolio={portfolio.data} />
            )}
            <RecentTrades symbol={symbol} trades={trades.data} loading={trades.loading && !trades.data} />
          </div>
        </div>
      )}
    </div>
  );
}
