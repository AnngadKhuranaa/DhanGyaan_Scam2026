import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FlaskConical, TrendingUp, Brain, Radio, Trophy } from 'lucide-react';

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/sandbox',     label: 'Risk Sandbox', icon: FlaskConical },
  { to: '/trade',       label: 'Paper Trade',  icon: TrendingUp },
  { to: '/portfolio',   label: 'AI Explainer', icon: Brain },
  { to: '/sentiment',   label: 'Live Sentiment',icon: Radio },
  { to: '/leaderboard', label: 'Leaderboard',  icon: Trophy },
];

export default function Sidebar() {
  return (
    <aside className="w-64 hidden md:flex flex-col glass-card rounded-none border-y-0 border-l-0 py-6">
      {/* Logo */}
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-display font-bold text-gradient">धनGyaan</h1>
        <p className="text-xs text-slate-500 mt-0.5">AI Stock Learning</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer hint */}
      <div className="px-6 mt-6">
        <div className="glass-card p-3 text-xs text-slate-500">
          💡 All trades are virtual. Practice risk-free!
        </div>
      </div>
    </aside>
  );
}
