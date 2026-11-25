import { create } from 'zustand';
import { refreshSession, setAccessToken, setSessionExpiredHandler } from '../lib/api';
import { authService } from '../services';

/**
 * Session state. Nothing is persisted to localStorage: on load we call
 * /auth/refresh, and the httpOnly cookie decides whether we're logged in.
 * status: 'loading' (checking cookie) | 'authenticated' | 'anonymous'
 */
export const useAuthStore = create((set) => {
  const startSession = ({ user, accessToken }) => {
    setAccessToken(accessToken);
    set({ user, status: 'authenticated' });
    return user;
  };
  const endSession = () => {
    setAccessToken(null);
    set({ user: null, status: 'anonymous' });
  };

  setSessionExpiredHandler(endSession);

  return {
    user: null,
    status: 'loading',

    bootstrap: async () => {
      try {
        startSession(await refreshSession());
      } catch {
        endSession();
      }
    },
    login: async (identifier, password) => startSession(await authService.login(identifier, password)),
    register: async (payload) => startSession(await authService.register(payload)),
    demoLogin: async () => startSession(await authService.demo()),
    logout: async () => {
      try {
        await authService.logout();
      } finally {
        endSession();
      }
    },
    /** Keep the cached cash balance in sync after a trade. */
    setBalance: (balance) => set((s) => (s.user ? { user: { ...s.user, balance } } : s)),
  };
});
