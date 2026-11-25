import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import MarketToggle from './MarketToggle';
import AIModal from './AIModal';

const menuItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Insights', to: '/insights' },
  { label: 'Simulator', to: '/simulator' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Leaderboard', to: '/leaderboard' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200/50 bg-white/60 backdrop-blur-2xl">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-200/50 to-transparent" />
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-4 md:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-gradient text-base font-bold text-white shadow-lg shadow-indigo-500/20">
              ध
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight text-slate-900">धनGyaan</p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">AI Investment Intelligence</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-2 md:flex">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'surface-gradient text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-500 hover:scale-105 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <MarketToggle />

            <NotificationDropdown 
              isOpen={isNotifOpen} 
              onClose={() => setIsNotifOpen(false)} 
              onToggle={() => setIsNotifOpen(!isNotifOpen)} 
            />
            
            <button
              type="button"
              onClick={() => setIsAIModalOpen(true)}
              className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:scale-105 hover:text-brand-600 md:inline-flex"
            >
              <Sparkles size={16} />
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate('/')}
              className="fintech-button gap-2 rounded-full px-5 py-2.5"
            >
              Get Started
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </header>
      
      <AIModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
      />
    </>
  );
}
