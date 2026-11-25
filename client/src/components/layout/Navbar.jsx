import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bot, ChevronDown, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import useUIStore from '../../store/useUIStore';
import { formatCompact } from '../../utils/formatCurrency';
import MarketToggle from '../MarketToggle';
import StockSearch from '../StockSearch';
import { Logo } from './Sidebar';

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const onLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="btn-ghost px-2" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-200" aria-hidden="true">
          {user?.username?.[0]?.toUpperCase()}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-sm font-semibold">{user?.username}</span>
          <span className="muted block text-xs tabular">Cash {formatCompact(user?.balance, 'INR')}</span>
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="px-3 py-2 text-xs">
            <p className="font-semibold">{user?.username}{user?.isDemo && <span className="badge-brand ml-2">demo</span>}</p>
            <p className="muted truncate">{user?.email}</p>
          </div>
          <button type="button" role="menuitem" onClick={onLogout} className="btn-ghost w-full justify-start">
            <LogOut size={16} aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const openDetail = useUIStore((s) => s.openDetail);
  const openAI = useUIStore((s) => s.openAI);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-6">
        <button type="button" className="icon-btn lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation menu">
          <Menu size={20} />
        </button>
        <span className="hidden sm:block lg:hidden"><Logo /></span>

        <StockSearch className="min-w-0 flex-1 md:max-w-md" onSelect={(s) => openDetail(s.symbol)} />

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <MarketToggle className="hidden sm:inline-flex" />
          <button type="button" className="icon-btn" onClick={() => openAI()} aria-label="Open AI investing tutor">
            <Bot size={19} />
          </button>
          <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <UserMenu />
        </div>
      </div>
      <div className="border-t border-slate-100 px-3 py-2 sm:hidden dark:border-slate-800">
        <MarketToggle className="w-full [&>button]:flex-1" />
      </div>
    </header>
  );
}
