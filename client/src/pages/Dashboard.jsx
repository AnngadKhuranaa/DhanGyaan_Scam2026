import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Star, Trash2 } from 'lucide-react';
import { marketService, tradeService } from '../services';
import useAsync from '../hooks/useAsync';
import { useAuthStore } from '../store/authStore';
import useUIStore from '../store/useUIStore';
import { useWatchlistStore } from '../store/watchlistStore';
import { formatCompact, formatCurrency, formatVolume } from '../utils/formatCurrency';
import { fromNow } from '../utils/formatDate';
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from '../components/ui/States';
import { PercentChange, SignedMoney, Stat } from '../components/ui/Values';
import Sparkline from '../components/charts/Sparkline';

const MOVER_TABS = [
  ['gainers', 'Top gainers'],
  ['losers', 'Top losers'],
  ['mostActive', 'Most active'],
];

function PortfolioSnapshot() {
  const { data, error, loading, reload } = useAsync(() => tradeService.portfolio(), []);
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px] w-full rounded-2xl" />)}
      </div>
    );
  }
  if (error) return <div className="card"><ErrorState error={error} onRetry={reload} title="Portfolio unavailable" compact /></div>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Portfolio value" value={formatCompact(data.totalValue, 'INR')} sub={<PercentChange value={data.totalReturnPercent} />} />
      <Stat label="Total P&L" value={<SignedMoney value={data.totalPnL} />} sub={<span className="muted">realised + unrealised</span>} />
      <Stat label="Invested" value={formatCompact(data.holdingsValue, 'INR')} sub={<span className="muted">{data.holdings.length} holding{data.holdings.length === 1 ? '' : 's'}</span>} />
      <Stat label="Cash" value={formatCompact(data.cash, 'INR')} sub={<Link to="/trade" className="font-medium text-brand-700 hover:underline dark:text-brand-300">Place a trade →</Link>} />
    </div>
  );
}

function WatchlistPanel() {
  const { items, status, error, load, remove, pricesStale } = useWatchlistStore();
  const openDetail = useUIStore((s) => s.openDetail);

  return (
    <section className="card" aria-labelledby="watchlist-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="watchlist-title" className="card-title">Watchlist</h2>
        {pricesStale && <span className="badge-warn">Prices delayed</span>}
      </div>
      {status === 'loading' && <SkeletonRows rows={4} className="h-12" />}
      {status === 'error' && <ErrorState error={error} onRetry={load} compact />}
      {status === 'ready' && items.length === 0 && (
        <EmptyState
          icon={Star}
          title="Your watchlist is empty"
          message="Search for a stock in the top bar, open it and press “Watch” to track it here with live prices."
        />
      )}
      {status === 'ready' && items.length > 0 && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => (
            <li key={item.symbol} className="flex items-center gap-3 py-2.5">
              <button type="button" onClick={() => openDetail(item.symbol)} className="min-w-0 flex-1 text-left">
                <span className="block truncate font-semibold">{item.symbol}</span>
                <span className="muted block truncate text-xs">{item.name}</span>
              </button>
              <Sparkline symbol={item.symbol} />
              <div className="w-28 text-right">
                <p className="tabular text-sm font-medium">{item.quote ? formatCurrency(item.quote.price, item.quote.currency) : '—'}</p>
                <PercentChange value={item.quote?.changePercent} className="text-xs" />
              </div>
              <button type="button" className="icon-btn h-8 w-8" onClick={() => remove(item.symbol)} aria-label={`Remove ${item.symbol} from watchlist`}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MarketMovers() {
  const market = useUIStore((s) => s.market);
  const openDetail = useUIStore((s) => s.openDetail);
  const [tab, setTab] = useState('gainers');
  const { data, error, loading, reload } = useAsync(() => marketService.movers(market), [market], { keepPreviousData: true });

  useEffect(() => {
    const id = setInterval(reload, 60_000); // server caches quotes for 30s
    return () => clearInterval(id);
  }, [reload]);

  const rows = data?.[tab] || [];
  return (
    <section className="card" aria-labelledby="movers-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="movers-title" className="card-title">Market movers · {market === 'IN' ? 'NSE' : 'US'}</h2>
          {data && <p className="muted text-xs">From {data.universe} · updated {fromNow(data.asOf)}</p>}
        </div>
        <button type="button" className="icon-btn h-8 w-8" onClick={reload} aria-label="Refresh market movers" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="tab-list mb-3" role="tablist" aria-label="Movers">
        {MOVER_TABS.map(([key, label]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`tab ${tab === key ? 'tab-active' : ''}`}>
            {label}
          </button>
        ))}
      </div>
      {loading && !data && <SkeletonRows rows={5} className="h-11" />}
      {error && !data && <ErrorState error={error} onRetry={reload} compact />}
      {data && rows.length === 0 && <EmptyState title="No movers right now" message="The market data feed returned no quotes." />}
      {data && rows.length > 0 && (
        <div className="-mx-2 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th scope="col">Stock</th>
                <th scope="col" className="text-right">Price</th>
                <th scope="col" className="text-right">Change</th>
                <th scope="col" className="hidden text-right sm:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.symbol} className="cursor-pointer" onClick={() => openDetail(q.symbol)}>
                  <td>
                    <button type="button" className="text-left" onClick={() => openDetail(q.symbol)}>
                      <span className="block font-semibold">{q.symbol.replace(/\.NS$/, '')}</span>
                      <span className="muted block max-w-[180px] truncate text-xs">{q.shortName}</span>
                    </button>
                  </td>
                  <td className="tabular text-right">{formatCurrency(q.price, q.currency)}</td>
                  <td className="text-right"><PercentChange value={q.changePercent} /></td>
                  <td className="tabular muted hidden text-right sm:table-cell">{formatVolume(q.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Welcome back, {user?.username}</h1>
        <p className="page-subtitle">Your paper portfolio, your watchlist and today’s biggest moves.</p>
      </div>
      <PortfolioSnapshot />
      <div className="grid gap-6 lg:grid-cols-2">
        <WatchlistPanel />
        <MarketMovers />
      </div>
    </div>
  );
}
