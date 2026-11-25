import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bot, Briefcase, FlaskConical, Gauge, Newspaper, PlayCircle, ShieldCheck, Trophy } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../lib/api';
import AuthModal from '../components/AuthModal';
import { Logo } from '../components/layout/Sidebar';
import { Spinner } from '../components/ui/States';

const FEATURES = [
  { icon: Briefcase, title: 'Paper trading', text: 'Start with ₹10,00,000 of virtual cash. Buy and sell NSE and US stocks at live prices; every order is executed atomically on the server.' },
  { icon: FlaskConical, title: 'Monte Carlo risk simulator', text: 'Thousands of geometric-Brownian-motion paths calibrated on real daily returns give best, median and worst outcomes, P(loss) and VaR.' },
  { icon: Gauge, title: 'Transparent confidence score', text: 'Trend, momentum, volatility and news sentiment combined with published weights. You can see exactly how every point was earned.' },
  { icon: Newspaper, title: 'News sentiment', text: 'Recent headlines scored with a deterministic lexicon. Each score shows the words that produced it.' },
  { icon: Bot, title: 'AI tutor', text: 'Ask questions in plain English. The AI receives your real position and the computed metrics, so answers cite actual numbers.' },
  { icon: Trophy, title: 'Leaderboard & watchlist', text: 'Track stocks with live prices and see how your paper returns rank against other learners.' },
];

const MATH = [
  ['Risk', 'Vₜ₊₁ = Vₜ · e^(μ + σZ), Z ~ N(0,1); μ, σ from real daily log returns'],
  ['VaR 95%', 'Amount invested − 5th-percentile simulated value'],
  ['Confidence', '30% trend + 25% momentum + 25% volatility + 20% sentiment'],
  ['P&L', 'Weighted-average cost in ₹ (incl. FX for US stocks), realised on sell'],
];

export default function Landing() {
  const status = useAuthStore((s) => s.status);
  const demoLogin = useAuthStore((s) => s.demoLogin);
  const navigate = useNavigate();
  const [auth, setAuth] = useState(null); // 'login' | 'register' | null
  const [demoLoading, setDemoLoading] = useState(false);
  const signedIn = status === 'authenticated';

  const tryDemo = async () => {
    setDemoLoading(true);
    try {
      await demoLogin();
      toast.success('Logged in to the shared demo account');
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Account">
          {signedIn ? (
            <Link to="/dashboard" className="btn-primary">Open dashboard</Link>
          ) : (
            <>
              <button type="button" className="btn-ghost" onClick={() => setAuth('login')}>Log in</button>
              <button type="button" className="btn-primary" onClick={() => setAuth('register')}>Sign up</button>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center sm:px-6 sm:pt-16">
          <p className="badge-brand mx-auto mb-5 text-xs">Finvasia hackathon finalist</p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Understand the risk <span className="text-gradient">before</span> you invest.
          </h1>
          <p className="muted mx-auto mt-5 max-w-2xl text-base sm:text-lg">
            DhanGyaan lets first-time investors practise with virtual money on real NSE and US prices, stress-test a stock with a
            Monte Carlo simulator, and see a confidence score whose every input is explained.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button type="button" className="btn-primary px-6 py-3 text-base" onClick={tryDemo} disabled={demoLoading}>
              {demoLoading ? <Spinner size={16} /> : <PlayCircle size={18} aria-hidden="true" />} Try the demo
            </button>
            {!signedIn && (
              <button type="button" className="btn-secondary px-6 py-3 text-base" onClick={() => setAuth('register')}>
                Create a free account
              </button>
            )}
          </div>
          <p className="muted mt-3 text-xs">No sign-up needed for the demo · No real money, ever</p>
        </section>

        <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900" aria-labelledby="features">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="features" className="text-center text-2xl font-bold sm:text-3xl">Everything a learner needs, nothing faked</h2>
            <p className="muted mx-auto mt-2 max-w-2xl text-center">
              Every number comes from live market data or a computation you can inspect. When a data source isn’t available, the
              app says so with a “Demo data” label.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <article key={title} className="card">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-200" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="muted mt-1.5 text-sm leading-relaxed">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="math">
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <div>
              <h2 id="math" className="text-2xl font-bold sm:text-3xl">The maths is on the page</h2>
              <p className="muted mt-3">
                Retail investors are often shown a single “safe” or “risky” label with no reasoning. DhanGyaan shows the formula,
                the inputs and the assumptions, so you learn <em>why</em> a stock is risky, not just that it is.
              </p>
              <ul className="mt-6 space-y-2 text-sm">
                <li className="flex gap-2"><ShieldCheck size={18} className="shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" /> Prices and execution are server-side; the browser can’t set its own price.</li>
                <li className="flex gap-2"><ShieldCheck size={18} className="shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" /> Each trade is a database transaction: cash, holdings and history never drift apart.</li>
                <li className="flex gap-2"><ShieldCheck size={18} className="shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" /> Simulations are seeded, so any result can be reproduced exactly.</li>
              </ul>
            </div>
            <dl className="card divide-y divide-slate-200 p-0 dark:divide-slate-800">
              {MATH.map(([k, v]) => (
                <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[120px_1fr]">
                  <dt className="text-sm font-semibold">{k}</dt>
                  <dd className="muted font-mono text-xs leading-relaxed sm:text-sm">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-4 py-8 text-center text-xs dark:border-slate-800">
        <p className="muted mx-auto max-w-2xl">
          DhanGyaan is an educational project built for the Finvasia hackathon. It uses virtual money only and does not provide
          investment advice. Market data from Yahoo Finance may be delayed.
        </p>
      </footer>

      <AuthModal key={auth} open={Boolean(auth)} mode={auth || 'login'} onClose={() => setAuth(null)} />
    </div>
  );
}
