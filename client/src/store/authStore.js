import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authService from '../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (identifier, password) => {
        const data = await authService.login(identifier, password);
        set({ user: data.user, token: data.token, isAuthenticated: true });
        return data;
      },

      register: async (username, email, phone, password) => {
        const data = await authService.register(username, email, phone, password);
        set({ user: data.user, token: data.token, isAuthenticated: true });
        return data;
      },

      logout: async () => {
        try { await authService.logout(); } catch {}
        set({ user: null, token: null, isAuthenticated: false });
      },

      setToken: (token) => set({ token }),
    }),
    { name: 'dhangyan-auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
);
