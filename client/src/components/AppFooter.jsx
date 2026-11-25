import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AppFooter() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) + " IST");
    };
    updateTime();
    const timer = setInterval(updateTime, 60000); // update every minute
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("token");
    navigate('/');
  };

  // Basic market hour check simulating Indian Market (9:15 AM to 3:30 PM IST)
  // Simplified for display purposes
  const currentHour = new Date().getUTCHours() + 5.5; // Approx IST
  const isMarketOpen = currentHour >= 9.25 && currentHour <= 15.5;

  return (
    <footer className="relative w-full bg-white/40 backdrop-blur-lg border-t border-slate-200/50 px-4 md:px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500 z-10">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200/40 to-transparent" />
      
      {/* Left Section - System Status */}
      <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span>System Live</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          <span>Market: {isMarketOpen ? 'Open' : 'Closed'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span>Data: Real-time</span>
        </div>
        <div className="hidden md:block w-px h-3 bg-slate-300 mx-1"></div>
        <span className="text-slate-400 font-mono tracking-tight">{time}</span>
      </div>

      {/* Center Section - Quick Actions */}
      <div className="flex flex-wrap justify-center gap-6">
        <Link to="/dashboard" className="transition-colors hover:text-indigo-600">Dashboard</Link>
        <Link to="/portfolio" className="transition-colors hover:text-indigo-600">Portfolio</Link>
        <Link to="/simulator" className="transition-colors hover:text-indigo-600">Simulator</Link>
        <Link to="/leaderboard" className="transition-colors hover:text-indigo-600">Leaderboard</Link>
      </div>

      {/* Right Section - User + Info */}
      <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4 text-center md:text-right">
        <span className="text-[10px] text-slate-400 uppercase tracking-widest hidden lg:block">
          AI insights are for educational purposes only
        </span>
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          {user && (
            <span className="font-semibold text-slate-700">
              {user.username || user.name || user.email || 'Investor'}
            </span>
          )}
          <button 
            onClick={handleLogout}
            className="text-rose-500 hover:text-rose-600 transition-colors bg-rose-50 hover:bg-rose-100 rounded-full px-2 py-0.5"
          >
            Logout
          </button>
        </div>
      </div>

    </footer>
  );
}
