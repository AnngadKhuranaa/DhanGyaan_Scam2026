import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global UI store — manages market mode (bull/bear) across the app.
 * Persisted to localStorage so the toggle survives page reloads.
 */
const useUIStore = create(
  persist(
    (set) => ({
      marketMode: 'bull', // 'bull' | 'bear'
      setMarketMode: (mode) => set({ marketMode: mode }),
      toggleMarketMode: () =>
        set((state) => ({
          marketMode: state.marketMode === 'bull' ? 'bear' : 'bull',
        })),
    }),
    { name: 'dhangyaan-ui' }
  )
);

export default useUIStore;
