import { ArrowRight, Play, TrendingUp, BarChart3, ShieldCheck, Sparkles, Zap, Target } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import AuthModal from '../components/AuthModal';

// ─── Floating stock-like cards in the hero ──────────────────────
function FloatingElements() {
  const items = [
    { label: 'NVDA', value: '+3.45%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', x: -10, y: -16, r: 3, d: 6, pos: 'left-[8%] top-[18%]' },
    { label: 'Risk Score', value: '94%', icon: ShieldCheck, color: 'text-brand-600', bg: 'bg-brand-50', x: 8, y: 14, r: -2, d: 7.5, pos: 'right-[6%] top-[12%]' },
    { label: 'AI Signal', value: 'Bullish', icon: Sparkles, color: 'text-violet-500', bg: 'bg-violet-50', x: -6, y: 12, r: 4, d: 5.5, pos: 'left-[4%] bottom-[28%]' },
    { label: 'Volatility', value: 'Low', icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-50', x: 10, y: -10, r: -5, d: 8, pos: 'right-[10%] bottom-[22%]' },
  ];

  return (
    <>
      {items.map(({ label, value, icon: Icon, color, bg, x, y, r, d, pos }, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, y, 0],
            x: [0, x, 0],
            rotate: [0, r, 0],
          }}
          transition={{ duration: d, repeat: Infinity, ease: 'easeInOut' }}
          className={`pointer-events-none absolute ${pos} z-10 hidden lg:flex items-center gap-2.5 rounded-2xl border border-white/60 bg-white/70 px-4 py-2.5 shadow-lg shadow-slate-200/40 backdrop-blur-md`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}>
            <Icon size={14} className={color} />
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-400">{label}</p>
            <p className={`text-sm font-bold ${color}`}>{value}</p>
          </div>
        </motion.div>
      ))}

      {/* Glowing dots */}
      {[
        'left-[20%] top-[35%]', 'right-[18%] top-[40%]',
        'left-[35%] bottom-[30%]', 'right-[30%] bottom-[35%]',
      ].map((pos, i) => (
        <motion.div
          key={`dot-${i}`}
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.4, 1] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
          className={`pointer-events-none absolute ${pos} h-2 w-2 rounded-full bg-brand-400/60 blur-[1px]`}
        />
      ))}
    </>
  );
}

// ─── Trust stats strip ──────────────────────────────────────────
function TrustStrip() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const stats = [
    { value: '10,000+', label: 'Simulations run' },
    { value: '94%', label: 'Confidence score' },
    { value: '< 200ms', label: 'Insight latency' },
    { value: '25+', label: 'Tracked stocks' },
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="relative mt-20 rounded-3xl border border-slate-200/60 bg-white/60 p-8 backdrop-blur-md md:mt-28"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-brand-50/50 via-transparent to-blue-50/50" />
      <div className="relative grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="text-center"
          >
            <p className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{stat.value}</p>
            <p className="mt-2 text-sm text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Feature section ────────────────────────────────────────────
function FeatureSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Insights',
      desc: 'Get real-time analysis powered by advanced sentiment and trend models.',
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: ShieldCheck,
      title: 'Risk Simulation',
      desc: 'Run Monte Carlo simulations and understand portfolio volatility before investing.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      title: 'Sentiment Analysis',
      desc: 'Read the market mood from news flow, social data, and analyst sentiment.',
      gradient: 'from-violet-500 to-indigo-500',
    },
    {
      icon: Zap,
      title: 'Paper Trading',
      desc: 'Practice with virtual funds in a real-time market environment — zero risk.',
      gradient: 'from-indigo-600 to-violet-500',
    },
  ];

  return (
    <section ref={ref} className="mt-28 md:mt-36">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-600">Capabilities</p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Everything you need to invest smarter
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
          A unified platform combining AI analysis, risk management, and market intelligence.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(79, 70, 229, 0.1)' }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition-all duration-300"
            >
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${feat.gradient} text-white shadow-md`}>
                <Icon size={20} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{feat.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-500">{feat.desc}</p>
              {/* Hover gradient  */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-50/0 to-blue-50/0 transition-all duration-500 group-hover:from-brand-50/40 group-hover:to-blue-50/30" />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ─── CTA Section ────────────────────────────────────────────────
function CTASection({ onOpen }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="relative mt-28 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-brand-600 to-blue-500 px-8 py-16 text-center text-white shadow-2xl md:mt-36 md:px-16 md:py-20"
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-200">Ready to start?</p>
        <h2 className="mx-auto mt-5 max-w-lg text-3xl font-bold tracking-tight md:text-5xl">
          Start making smarter investment decisions
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-blue-100/90">
          Join thousands learning to invest with confidence using AI-powered tools.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <motion.button
            type="button"
            onClick={onOpen}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:shadow-xl"
          >
            Get Started Free
            <ArrowRight size={16} />
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            <Play size={16} />
            Watch Demo
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Landing() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  function openModal() { setIsModalOpen(true); }
  function closeModal() { setIsModalOpen(false); }

  // Track scroll for navbar glass effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
        {/* ── BACKGROUND ── */}
        <div className="pointer-events-none fixed inset-0 z-0">
          {/* Main radial blobs */}
          <div className="absolute left-[-12rem] top-[-10rem] h-[500px] w-[500px] rounded-full bg-indigo-200/50 blur-[120px]" />
          <div className="absolute right-[-8rem] top-[10%] h-[450px] w-[450px] rounded-full bg-blue-200/40 blur-[100px]" />
          <div className="absolute bottom-[-10rem] left-[30%] h-[400px] w-[400px] rounded-full bg-violet-200/30 blur-[120px]" />
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] [background-image:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]" />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(79,70,229,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.4)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-6 md:px-10 lg:px-12">

          {/* ── NAVBAR ── */}
          <motion.header
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`sticky top-4 z-30 flex items-center justify-between rounded-full border px-5 py-3 transition-all duration-500 md:px-7 ${
              scrolled
                ? 'border-slate-200/80 bg-white/80 shadow-xl shadow-slate-200/40 backdrop-blur-xl'
                : 'border-slate-200/50 bg-white/60 shadow-lg shadow-slate-200/30 backdrop-blur-lg'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
                ध
              </div>
              <div>
                <p className="font-display text-base font-semibold text-slate-900 lg:text-lg">धनGyaan</p>
                <p className="hidden text-[10px] uppercase tracking-[0.22em] text-slate-400 sm:block">AI Investment Intelligence</p>
              </div>
            </div>

            {/* Nav links - desktop */}
            <nav className="hidden items-center gap-1 md:flex">
              {['Product', 'Features', 'About'].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="group relative px-4 py-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
                >
                  {link}
                  <span className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-brand-500 transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              ))}
            </nav>

            <motion.button
              type="button"
              onClick={openModal}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-glow"
            >
              Get Started
              <ArrowRight size={14} />
            </motion.button>
          </motion.header>

          {/* ── HERO ── */}
          <main className="relative grid min-h-[calc(100vh-120px)] items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-0">
            
            {/* Floating elements */}
            <FloatingElements />

            {/* Left: Copy */}
            <motion.section
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-brand-50/80 px-4 py-2 backdrop-blur-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">AI-Grade Infrastructure</span>
              </motion.div>

              <h1 className="mt-8 max-w-xl font-display text-[3.2rem] font-bold leading-[1.08] tracking-tight text-slate-900 md:text-[4.5rem]">
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text">Invest Smarter.</span>
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-brand-500 to-blue-500 bg-clip-text text-transparent">Understand Risk.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500 md:text-xl">
                AI-powered insights, risk simulation, and real-time sentiment analysis to help you make confident investment decisions.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <motion.button
                  type="button"
                  onClick={openModal}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2.5 rounded-2xl bg-brand-gradient px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:shadow-glow"
                >
                  Get Started
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="group inline-flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/80 px-8 py-4 text-base font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition-all hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700 hover:shadow-md"
                >
                  <Play size={18} className="transition-transform group-hover:scale-110" />
                  View Product
                </motion.button>
              </div>

              {/* Trust line */}
              <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Trusted insights for modern investors · No credit card required</span>
              </div>
            </motion.section>

            {/* Right: Protocol Card (Glassmorphism) */}
            <motion.section
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/50 p-1.5 shadow-[0_30px_90px_rgba(99,102,241,0.15)] backdrop-blur-xl"
              >
                {/* Inner glow ring */}
                <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-brand-400/20 via-transparent to-blue-400/20" />

                <div className="relative overflow-hidden rounded-[1.6rem] bg-white/80 backdrop-blur-md">
                  {/* Radial glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.12),transparent_50%),radial-gradient(circle_at_80%_90%,rgba(59,130,246,0.08),transparent_40%)]" />

                  <div className="relative grid gap-5 p-6">
                    {/* Top card */}
                    <div className="rounded-[1.5rem] bg-gradient-to-br from-indigo-600 via-brand-600 to-blue-500 p-7 text-white shadow-lg">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-200">Protocol Layer</p>
                      <h2 className="mt-4 text-2xl font-bold leading-snug md:text-3xl">Built for modern financial interfaces</h2>
                      <p className="mt-3 max-w-md text-sm leading-7 text-blue-100/80">
                        Unified insights, simulation surfaces, and portfolio analytics in a high-trust design system.
                      </p>
                    </div>

                    {/* Stat cards */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: 'Simulation speed', value: '100x', trend: '+40%' },
                        { label: 'Portfolio confidence', value: '94%', trend: '+12%' },
                      ].map((stat) => (
                        <motion.div
                          key={stat.label}
                          whileHover={{ scale: 1.03, boxShadow: '0 12px 40px rgba(79, 70, 229, 0.08)' }}
                          className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all"
                        >
                          <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                          <div className="mt-2.5 flex items-end justify-between">
                            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">{stat.trend}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.section>
          </main>

          {/* ── TRUST STATS ── */}
          <TrustStrip />

          {/* ── FEATURES ── */}
          <FeatureSection />

          {/* ── CTA ── */}
          <CTASection onOpen={openModal} />

          {/* ── FOOTER ── */}
          <footer className="mt-28 border-t border-slate-200/60 pt-16 pb-8 md:mt-36">
            <div className="grid gap-10 md:grid-cols-4">
              {/* Brand */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-sm font-bold text-white shadow-sm">
                    ध
                  </div>
                  <span className="font-display text-lg font-semibold text-slate-900">धनGyaan</span>
                </div>
                <p className="max-w-xs text-sm leading-relaxed text-slate-500">
                  Smarter investing with AI-driven insights, risk simulation, and real-time market intelligence.
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="mb-4 text-sm font-semibold text-slate-900">Product</h4>
                <ul className="flex flex-col gap-3 text-sm text-slate-500">
                  {['Dashboard', 'Simulator', 'Portfolio', 'Leaderboard'].map((item) => (
                    <li key={item}>
                      <a href={`#${item.toLowerCase()}`} className="transition-colors hover:text-brand-600">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Features */}
              <div>
                <h4 className="mb-4 text-sm font-semibold text-slate-900">Features</h4>
                <ul className="flex flex-col gap-3 text-sm text-slate-500">
                  {['Risk Analysis', 'AI Insights', 'Market Sentiment', 'Paper Trading'].map((item) => (
                    <li key={item}>
                      <a href={`#${item.toLowerCase().replace(' ', '-')}`} className="transition-colors hover:text-brand-600">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Connect */}
              <div>
                <h4 className="mb-4 text-sm font-semibold text-slate-900">Connect</h4>
                <ul className="flex flex-col gap-3 text-sm text-slate-500">
                  {['Twitter', 'LinkedIn', 'GitHub', 'Email contact'].map((item) => (
                    <li key={item}>
                      <a href={`#${item.toLowerCase()}`} className="transition-colors hover:text-brand-600">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom strip */}
            <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-200/60 pt-8 sm:flex-row">
              <p className="text-xs text-slate-400">© 2026 धनGyaan — AI Investment Intelligence</p>
              <p className="text-xs font-medium text-slate-400">Built for modern investors</p>
            </div>
          </footer>
        </div>
      </div>

      <AuthModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}
