import { Suspense, lazy, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useWatchlistStore } from '../../store/watchlistStore';
import useUIStore from '../../store/useUIStore';
import { PageSkeleton } from '../ui/PageSkeleton';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

// Heavy overlays (charting library, chat) download only the first time they open.
const StockDetailDrawer = lazy(() => import('../StockDetailDrawer'));
const AIChatModal = lazy(() => import('../AIChatModal'));

/** Shell for every signed-in page: sidebar, top bar, page outlet, global drawers. */
export default function AppLayout() {
  const loadWatchlist = useWatchlistStore((s) => s.load);
  const drawerOpen = useUIStore((s) => Boolean(s.detailSymbol));
  const aiOpen = useUIStore((s) => s.ai.open);
  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-6">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <footer className="muted border-t border-slate-200 px-6 py-4 text-center text-xs dark:border-slate-800">
          Market data from Yahoo Finance, may be delayed. Paper trading with virtual money · Educational use only, not financial advice.
        </footer>
      </div>
      <Suspense fallback={null}>
        {drawerOpen && <StockDetailDrawer />}
        {aiOpen && <AIChatModal />}
      </Suspense>
    </div>
  );
}
