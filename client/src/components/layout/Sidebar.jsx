import { NavLink } from 'react-router-dom';
import { Activity, Briefcase, FlaskConical, LayoutDashboard, LineChart, Sparkles, Trophy } from 'lucide-react';
import { marketService } from '../../services';
import useAsync from '../../hooks/useAsync';
import useUIStore from '../../store/useUIStore';
import { formatNumber } from '../../utils/formatCurrency';
import { Drawer } from '../ui/Overlay';
import { Skeleton } from '../ui/States';
import { PercentChange } from '../ui/Values';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trade', label: 'Trade', icon: LineChart },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { to: '/simulator', label: 'Risk simulator', icon: FlaskConical },
  { to: '/insights', label: 'Insights', icon: Sparkles },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

/** Real index levels for the selected market (replaces the old random "pulse"). */
function MarketPulse() {
  const market = useUIStore((s) => s.market);
  const { data, loading, error } = useAsync(() => marketService.indices(market), [market]);

  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <Activity size={13} aria-hidden="true" /> Market pulse
      </p>
      {loading && <div className="space-y-2"><Skeleton className="h-4" /><Skeleton className="h-4" /><Skeleton className="h-4" /></div>}
      {error && <p className="muted text-xs">Index data unavailable</p>}
      {data && (
        <ul className="space-y-1.5 text-sm">
          {data.map((i) => (
            <li key={i.symbol} className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">{i.name}</span>
              <span className="text-right">
                <span className="tabular block text-xs text-slate-700 dark:text-slate-300">{formatNumber(i.price, 2)}</span>
                <PercentChange value={i.changePercent} className="text-xs" />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NavContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <nav aria-label="Main">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <MarketPulse />
      <p className="muted mt-auto text-xs leading-relaxed">
        Virtual money only. DhanGyaan is an educational tool, not investment advice.
      </p>
    </div>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 font-bold text-white dark:bg-brand-500 dark:text-slate-950" aria-hidden="true">
        ध
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        धन<span className="text-gradient">Gyaan</span>
      </span>
    </span>
  );
}

/** Fixed sidebar on desktop (lg+); slide-in drawer on mobile/tablet. */
export default function Sidebar() {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-slate-200 bg-white px-4 py-5 lg:flex dark:border-slate-800 dark:bg-slate-900">
        <Logo />
        <NavContent />
      </aside>
      <Drawer open={open} onClose={() => setOpen(false)} title="DhanGyaan" side="left" width="max-w-[280px]">
        <NavContent onNavigate={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
