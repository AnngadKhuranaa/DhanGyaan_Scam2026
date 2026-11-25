import { create } from 'zustand';

export const useTradeStore = create((set, get) => ({
  portfolio: null,
  trades: [],
  isLoading: false,

  setPortfolio: (portfolio) => set({ portfolio }),
  setTrades: (trades) => set({ trades }),
  setLoading: (isLoading) => set({ isLoading }),

  addTrade: (trade) => set((state) => ({ trades: [trade, ...state.trades] })),
}));
