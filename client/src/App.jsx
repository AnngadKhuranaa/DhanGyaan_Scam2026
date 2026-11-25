import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import useUIStore from './store/useUIStore';
import AppLayout from './components/layout/AppLayout';
import { FullPageLoader } from './components/ui/PageSkeleton';

// Route-level code splitting: each page is its own chunk, downloaded on first visit.
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Trade = lazy(() => import('./pages/Trade'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Simulator = lazy(() => import('./pages/Simulator'));
const Insights = lazy(() => import('./pages/Insights'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Wait for the session check, then either render the app or send the user to the landing page. */
function ProtectedRoute({ children }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status !== 'authenticated') return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return children;
}

function ThemeSync() {
  const theme = useUIStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  return null;
}

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <BrowserRouter>
      <ThemeSync />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: theme === 'dark' ? { background: '#1e293b', color: '#f1f5f9' } : undefined,
        }}
      />
      <Suspense fallback={<FullPageLoader />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
