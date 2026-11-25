import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { communityService, marketService } from '../services';
import useAsync from '../hooks/useAsync';
import useUIStore from '../store/useUIStore';
import { formatCurrency } from '../utils/formatCurrency';
import { fromNow } from '../utils/formatDate';
import { EmptyState, ErrorState, SkeletonRows } from '../components/ui/States';
import { PercentChange, SignedMoney } from '../components/ui/Values';

const PAGE_SIZE = 20;

function Row({ r }) {
  return (
    <tr className={r.isMe ? 'bg-brand-50/70 dark:bg-brand-900/30' : ''}>
      <td className="tabular font-semibold">{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : `#${r.rank}`}</td>
      <td className="font-medium">
        {r.username}
        {r.isMe && <span className="badge-brand ml-2">you</span>}
        {r.isDemo && <span className="badge-neutral ml-2">demo</span>}
      </td>
      <td className="text-right"><PercentChange value={r.totalReturnPercent} /></td>
      <td className="text-right"><SignedMoney value={r.totalPnL} /></td>
      <td className="tabular hidden text-right sm:table-cell">{formatCurrency(r.totalValue, 'INR', 0)}</td>
      <td className="tabular muted hidden text-right md:table-cell">{r.holdingsCount}</td>
    </tr>
  );
}

function Traders() {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useAsync(() => communityService.leaderboard(page, PAGE_SIZE), [page], { keepPreviousData: true });

  if (loading && !data) return <SkeletonRows rows={8} className="h-10" />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (data.total === 0) return <EmptyState icon={Trophy} title="No traders yet" action={<Link to="/trade" className="btn-primary">Be the first</Link>} />;

  const meOffPage = data.me && !data.items.some((r) => r.isMe);
  return (
    <div>
      <p className="muted mb-3 text-xs">Ranked by return on starting balance at live prices · {data.total} traders · updated {fromNow(data.asOf)}</p>
      <div className={`-mx-2 overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
        <table className="table-base">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Trader</th>
              <th scope="col" className="text-right">Return</th>
              <th scope="col" className="text-right">P&L</th>
              <th scope="col" className="hidden text-right sm:table-cell">Portfolio value</th>
              <th scope="col" className="hidden text-right md:table-cell">Holdings</th>
            </tr>
          </thead>
          <tbody>
            {meOffPage && <Row r={data.me} />}
            {data.items.map((r) => <Row key={r.rank} r={r} />)}
          </tbody>
        </table>
      </div>
      <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Leaderboard pages">
        <span className="muted">Page {data.page} of {data.totalPages}</span>
        <span className="flex gap-2">
          <button type="button" className="btn-secondary px-3" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
          <button type="button" className="btn-secondary px-3" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
        </span>
      </nav>
    </div>
  );
}

function MoverList({ title, rows, onOpen }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((q) => (
          <li key={q.symbol}>
            <button type="button" onClick={() => onOpen(q.symbol)} className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm">
              <span className="min-w-0 truncate font-medium">{q.symbol.replace('.NS', '')}</span>
              <span className="flex items-center gap-3">
                <span className="tabular muted">{formatCurrency(q.price, q.currency)}</span>
                <PercentChange value={q.changePercent} className="w-20 justify-end" />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Movers() {
  const market = useUIStore((s) => s.market);
  const openDetail = useUIStore((s) => s.openDetail);
  const { data, error, loading, reload } = useAsync(() => marketService.movers(market), [market]);
  if (loading) return <SkeletonRows rows={6} className="h-10" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div>
      <p className="muted mb-4 text-xs">From {data.universe} · switch NSE/US in the top bar</p>
      <div className="grid gap-6 md:grid-cols-3">
        <MoverList title="Top gainers" rows={data.gainers} onOpen={openDetail} />
        <MoverList title="Top losers" rows={data.losers} onOpen={openDetail} />
        <MoverList title="Most active" rows={data.mostActive} onOpen={openDetail} />
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [tab, setTab] = useState('traders');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">See how your paper returns compare, and what’s moving in the market today.</p>
      </div>
      <div className="tab-list" role="tablist" aria-label="Leaderboard views">
        {[['traders', 'Top traders'], ['movers', 'Market movers']].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`tab ${tab === k ? 'tab-active' : ''}`}>{l}</button>
        ))}
      </div>
      <section className="card" role="tabpanel">{tab === 'traders' ? <Traders /> : <Movers />}</section>
    </div>
  );
}
