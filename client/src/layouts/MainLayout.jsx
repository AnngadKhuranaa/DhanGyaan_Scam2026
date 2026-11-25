import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AppFooter from '../components/AppFooter';
import useUIStore from '../store/useUIStore';

export default function MainLayout({ children }) {
  const marketMode = useUIStore((s) => s.marketMode);
  const isBull = marketMode === 'bull';

  return (
    <div
      className={`flex min-h-screen text-slate-900 transition-colors duration-500 ${isBull ? 'bg-[#f3f4f8]' : 'bg-[#f5f3f6]'}`}
      style={{ '--accent': isBull ? '142 71% 45%' : '0 72% 51%' }}
    >
      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
        {/* Layered background glows */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className={`absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full blur-[100px] transition-colors duration-700 ${isBull ? 'bg-indigo-200/30' : 'bg-rose-200/20'}`} />
          <div className={`absolute top-10 right-[-5rem] h-[350px] w-[350px] rounded-full blur-[90px] transition-colors duration-700 ${isBull ? 'bg-blue-200/25' : 'bg-red-200/15'}`} />
          <div className={`absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full blur-[100px] transition-colors duration-700 ${isBull ? 'bg-violet-200/15' : 'bg-rose-200/10'}`} />
          <div className="absolute inset-0 opacity-[0.018] [background-image:linear-gradient(rgba(79,70,229,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.5)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-white/40 to-indigo-50/50" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col h-screen">
          <Navbar />

          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
            <div className="fintech-panel min-h-full p-6 md:p-8">
              {children}
            </div>
          </main>

          <AppFooter />
        </div>
      </div>
    </div>
  );
}
