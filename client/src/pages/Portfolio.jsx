import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Briefcase, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { aiService, tradeService } from '../services';
import { getErrorMessage } from '../lib/api';
import useAsync from '../hooks/useAsync';
import useUIStore from '../store/useUIStore';
import { formatCurrency, formatPercent } from '../utils/formatCurrency';
import { formatDateTime } from '../utils/formatDate';
import AllocationPie from '../components/charts/AllocationPie';
import { EmptyState, ErrorState, Skeleton, SkeletonRows, Spinner } from '../components/ui/States';
import { PercentChange, SignedMoney, Stat } from '../components/ui/Values';

function Holdings({ data }) {
  const openDetail = useUIStore((s) => s.openDetail);
  if (data.holdings.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No holdings yet"
        message="You have your full virtual balance in cash. Place your first paper trade to start building a portfolio."
        action={<Link to="/trade" className="btn-primary">Place a trade</Link>}
      />
    );
  }
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="table-base">
        <caption className="sr-only">Holdings valued at live prices</caption>
        <thead>
          <tr>
            <th scope="col">Stock</th>
            <th scope="col" className="text-right">Qty</th>
            <th scope="col" className="text-right">Avg price</th>
            <th scope="col" className="text-right">Last price</th>
            <th scope="col" className="text-right">Value (₹)</th>
            <th scope="col" className="text-right">Unrealised P&L</th>
            <th scope="col" className="text-right">Weight</th>
          </tr>
        </thead>
        <tbody>
          {data.holdings.map((h) => (
            <tr key={h.symbol}>
              <td>
                <button type="button" className="text-left" onClick={() => openDetail(h.symbol)}>
                  <span className="block font-semibold hover:underline">{h.symbol}</span>
                  <span className="muted block max-w-[160px] truncate text-xs">{h.name}</span>
                </button>
              </td>
              <td className="tabular text-right">{h.quantity}</td>
              <td className="tabular text-right">{formatCurrency(h.avgPrice, h.currency)}</td>
              <td className="tabular text-right">
                {formatCurrency(h.currentPrice, h.currency)}
                {h.priceStale ? <span className="badge-warn ml-1">stale</span> : <PercentChange value={h.dayChangePercent} className="block text-xs" />}
              </td>
              <td className="tabular text-right">{formatCurrency(h.marketValueInr, 'INR')}</td>
              <td className="text-right">
                <SignedMoney value={h.unrealizedPnL} />
                <span className="block text-xs"><PercentChange value={h.unrealizedPnLPercent} /></span>
              </td>
              <td className="tabular muted text-right">{h.allocationPercent.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PAGE_SIZE = 10;

function TradeHistory() {
  const [filters, setFilters] = useState({ symbol: '', side: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const params = Object.fromEntries(Object.entries({ ...filters, page, limit: PAGE_SIZE }).filter(([, v]) => v !== ''));
  const { data, error, loading, reload } = useAsync(() => tradeService.history(params), [JSON.stringify(params)], { keepPreviousData: true });

  const update = (key) => (e) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: key === 'symbol' ? e.target.value.toUpperCase() : e.target.value }));
  };
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <section className="card" aria-labelledby="history-title">
      <h2 id="history-title" className="card-title mb-4">Trade history</h2>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="label" htmlFor="f-symbol">Symbol</label>
          <input id="f-symbol" className="input" value={filters.symbol} onChange={update('symbol')} placeholder="e.g. TCS.NS" maxLength={20} />
        </div>
        <div>
          <label className="label" htmlFor="f-side">Side</label>
          <select id="f-side" className="input" value={filters.side} onChange={update('side')}>
            <option value="">All</option>
            <option value="BUY">Buy</option>
            <option value="SELL">Sell</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-from">From</label>
          <input id="f-from" type="date" className="input" value={filters.from} onChange={update('from')} />
        </div>
        <div>
          <label className="label" htmlFor="f-to">To</label>
          <input id="f-to" type="date" className="input" value={filters.to} onChange={update('to')} />
        </div>
        <div className="flex items-end">
          <button type="button" className="btn-ghost w-full" disabled={!hasFilters} onClick={() => { setFilters({ symbol: '', side: '', from: '', to: '' }); setPage(1); }}>
            Clear filters
          </button>
        </div>
      </div>

      {loading && !data && <SkeletonRows rows={5} className="h-10" />}
      {error && !data && <ErrorState error={error} onRetry={reload} compact />}
      {data && data.items.length === 0 && (
        <EmptyState
          icon={History}
          title={hasFilters ? 'No trades match these filters' : 'No trades yet'}
          message={hasFilters ? 'Try widening the date range or clearing filters.' : 'Every order you place appears here.'}
          action={!hasFilters && <Link to="/trade" className="btn-primary">Place a trade</Link>}
        />
      )}
      {data && data.items.length > 0 && (
        <>
          <div className={`-mx-2 overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="table-base">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Stock</th>
                  <th scope="col">Side</th>
                  <th scope="col" className="text-right">Qty</th>
                  <th scope="col" className="text-right">Price</th>
                  <th scope="col" className="text-right">Amount (₹)</th>
                  <th scope="col" className="text-right">Realised P&L</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => (
                  <tr key={t._id}>
                    <td className="muted text-xs">{formatDateTime(t.createdAt)}</td>
                    <td className="font-semibold">{t.symbol}</td>
                    <td><span className={t.side === 'BUY' ? 'badge-gain' : 'badge-loss'}>{t.side}</span></td>
                    <td className="tabular text-right">{t.quantity}</td>
                    <td className="tabular text-right">
                      {formatCurrency(t.price, t.currency)}
                      {t.currency !== 'INR' && <span className="muted block text-2xs">FX {t.fxRate.toFixed(2)}</span>}
                    </td>
                    <td className="tabular text-right">{formatCurrency(t.amountInr, 'INR')}</td>
                    <td className="text-right">{t.realizedPnL === null ? <span className="muted">—</span> : <SignedMoney value={t.realizedPnL} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Trade history pages">
            <span className="muted">{data.total} trade{data.total === 1 ? '' : 's'} · page {data.page} of {data.totalPages}</span>
            <span className="flex gap-2">
              <button type="button" className="btn-secondary px-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
              <button type="button" className="btn-secondary px-3" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
            </span>
          </nav>
        </>
      )}
    </section>
  );
}

function ExplainPortfolio() {
  const [state, setState] = useState({ loading: false, result: null, error: null });
  const run = async () => {
    setState({ loading: true, result: null, error: null });
    try {
      setState({ loading: false, result: await aiService.explainPortfolio(), error: null });
    } catch (error) {
      setState({ loading: false, result: null, error });
    }
  };
  return (
    <section className="card" aria-labelledby="explain-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="explain-title" className="card-title">Explain my portfolio</h2>
          <p className="muted text-sm">A plain-English read of concentration, P&L and risk, generated from your actual holdings.</p>
        </div>
        <button type="button" className="btn-primary" onClick={run} disabled={state.loading}>
          {state.loading ? <Spinner size={14} /> : <Bot size={16} aria-hidden="true" />} {state.result ? 'Regenerate' : 'Explain'}
        </button>
      </div>
      {state.error && <p className="field-error mt-3" role="alert">{getErrorMessage(state.error)}</p>}
      {state.loading && <div className="mt-4"><SkeletonRows rows={3} className="h-4" /></div>}
      {state.result && (
        <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60" aria-live="polite">
          <p className="whitespace-pre-line text-sm leading-relaxed">{state.result.reply}</p>
          <p className="muted mt-3 text-xs">via {state.result.provider} · {state.result.disclaimer}</p>
        </div>
      )}
    </section>
  );
}

export default function Portfolio() {
  const { data, error, loading, reload } = useAsync(() => tradeService.portfolio(), []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Portfolio</h1>
        <p className="page-subtitle">Holdings at live prices, profit and loss, allocation and every trade you’ve made. All values in ₹.</p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px] w-full rounded-2xl" />)}
        </div>
      )}
      {error && <div className="card"><ErrorState error={error} onRetry={reload} /></div>}

      {data && (
        <>
          {data.pricesStale && (
            <p className="badge-warn px-3 py-2 text-xs normal-case tracking-normal" role="status">
              Some live prices are unavailable; those holdings are valued at cost until prices return.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Total value" value={formatCurrency(data.totalValue, 'INR', 0)} sub={<span>{formatPercent(data.totalReturnPercent)} <span className="muted">vs {formatCurrency(data.startingBalance, 'INR', 0)} start</span></span>} />
            <Stat label="Unrealised P&L" value={<SignedMoney value={data.unrealizedPnL} />} sub={<span className="muted">on {formatCurrency(data.invested, 'INR', 0)} invested</span>} />
            <Stat label="Realised P&L" value={<SignedMoney value={data.realizedPnL} />} sub={<span className="muted">from completed sells</span>} />
            <Stat label="Cash" value={formatCurrency(data.cash, 'INR', 0)} sub={<span className="muted">available to trade</span>} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <section className="card" aria-labelledby="holdings-title">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="holdings-title" className="card-title">Holdings</h2>
                <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={reload}>Refresh prices</button>
              </div>
              <Holdings data={data} />
            </section>
            <section className="card" aria-labelledby="alloc-title">
              <h2 id="alloc-title" className="card-title mb-3">Allocation</h2>
              <AllocationPie allocation={data.allocation} />
            </section>
          </div>
        </>
      )}

      <ExplainPortfolio />
      <TradeHistory />
    </div>
  );
}
