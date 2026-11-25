import { Bell, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="h-16 glass-card rounded-none border-x-0 border-t-0 flex items-center justify-between px-6 z-10">
      {/* Search */}
      <div className="relative hidden sm:flex items-center">
        <Search className="absolute left-3 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Search stocks..."
          className="input-field pl-10 py-2 text-sm w-64"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="relative p-2 rounded-xl hover:bg-white/10 transition-colors">
          <Bell size={18} className="text-slate-300" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-400 rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-medium text-white">{user?.name}</span>
            <span className="text-xs text-slate-400">Investor</span>
          </div>
        </div>

        <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-colors text-slate-400">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
