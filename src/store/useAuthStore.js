import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const AUTH_KEY = 'hatten_auth';

/**
 * Auth state: user + role (Admin | Resident).
 * Persisted to localStorage for session restore.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      role: null,
      token: null,
      isAuthenticated: false,

      login: (user, role, token = 'mock-token') => {
        set({
          user,
          role: role || user?.role,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          role: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user) => set((state) => ({ user, role: user?.role || state.role })),
    }),
    { name: AUTH_KEY }
  )
);

export const isAdmin = () => useAuthStore.getState().role === 'Admin';
export const isResident = () => useAuthStore.getState().role === 'Resident';
