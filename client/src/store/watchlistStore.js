import { create } from 'zustand';
import toast from 'react-hot-toast';
import { communityService } from '../services';
import { getErrorMessage } from '../lib/api';

/** Shared watchlist so the dashboard panel and the stock drawer stay in sync. */
export const useWatchlistStore = create((set, get) => ({
  items: [],
  pricesStale: false,
  status: 'idle', // idle | loading | ready | error
  error: null,

  load: async () => {
    set({ status: get().status === 'ready' ? 'ready' : 'loading', error: null });
    try {
      const data = await communityService.watchlist();
      set({ items: data.items, pricesStale: data.pricesStale, status: 'ready' });
    } catch (error) {
      set({ status: 'error', error });
    }
  },
  has: (symbol) => get().items.some((i) => i.symbol === symbol),
  add: async (symbol) => {
    try {
      const data = await communityService.addToWatchlist(symbol);
      set({ items: data.items, pricesStale: data.pricesStale, status: 'ready' });
      toast.success(`${symbol} added to watchlist`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },
  remove: async (symbol) => {
    try {
      const data = await communityService.removeFromWatchlist(symbol);
      set({ items: data.items, pricesStale: data.pricesStale });
      toast.success(`${symbol} removed from watchlist`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  },
}));
