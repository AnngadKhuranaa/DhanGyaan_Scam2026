import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Brain, FlaskConical, Radio, Trophy, ArrowRight, Shield } from 'lucide-react';

const features = [
  { icon: FlaskConical, title: 'Risk Simulatior',   desc: 'Monte Carlo simulations for any stock scenario', color: 'text-purple-400' },
  { icon: TrendingUp,   title: 'Paper Trading',     desc: 'Trade with ₹1 lakh virtual money, zero real risk', color: 'text-brand-400' },
  { icon: Brain,        title: 'AI Explainer',      desc: 'GPT/Gemini explains your portfolio in plain language', color: 'text-blue-400' },
  { icon: Radio,        title: 'Live Sentiment',    desc: 'Real-time tweet & news sentiment per stock', color: 'text-yellow-400' },
  { icon: Trophy,       title: 'Leaderboard',       desc: 'Compete with top paper traders', color: 'text-orange-400' },
  { icon: Shield,       title: 'Loss Probability',  desc: 'Know your downside before you invest', color: 'text-red-400' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-hero-gradient">
      {/* Header */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-gradient">धनGyaan</h1>
        <div className="flex gap-3">
          <Link to="/login" className="btn-secondary text-sm">Login</Link>
          <Link to="/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="badge-bullish mb-6 inline-block">🚀 AI-Powered Stock Learning</span>
          <h2 className="text-5xl sm:text-7xl font-display font-bold text-white leading-tight mb-6">
            Learn Stocks.<br />
            <span className="text-gradient">Simulate Risk.</span><br />
            Trade Smarter.
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            धनGyaan combines AI, real market data, and paper trading to help you master investing — without losing real money.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-7 py-3">
              Start Learning Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-7 py-3">Log In</Link>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="glass-card p-6 hover:glow-brand transition-all duration-300 hover:-translate-y-1"
            >
              <Icon className={`${color} mb-4`} size={28} />
              <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
