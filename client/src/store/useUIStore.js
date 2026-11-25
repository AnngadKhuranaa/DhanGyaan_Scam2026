import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const prefersDark = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

/** UI preferences: selected market (NSE/US), theme, and the mobile nav drawer. */
const useUIStore = create(
  persist(
    (set) => ({
      market: 'IN', // 'IN' (NSE) | 'US'
      theme: prefersDark() ? 'dark' : 'light',
      mobileNavOpen: false,
      // AI tutor modal: open from anywhere, optionally about a specific stock.
      ai: { open: false, symbol: null },
      openAI: (symbol = null) => set({ ai: { open: true, symbol } }),
      closeAI: () => set((s) => ({ ai: { ...s.ai, open: false } })),
      // Stock detail drawer, opened from any table/list.
      detailSymbol: null,
      openDetail: (detailSymbol) => set({ detailSymbol }),
      closeDetail: () => set({ detailSymbol: null }),
      setMarket: (market) => set({ market }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
    }),
    { name: 'dhangyaan-ui', partialize: ({ market, theme }) => ({ market, theme }) }
  )
);

export default useUIStore;
