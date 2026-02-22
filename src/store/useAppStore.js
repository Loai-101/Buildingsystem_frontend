import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * App-level UI state: accounts filters, booking filters, etc.
 * Persisted so filters survive refresh.
 */
const STORAGE_KEY = 'hatten_app_store';

export const useAppStore = create(
  persist(
    (set) => ({
      // Accounts list filters
      accountsFilterType: '',
      accountsFilterCategory: '',
      accountsFilterSearch: '',

      setAccountsFilters: (type, category, search) =>
        set({
          accountsFilterType: type,
          accountsFilterCategory: category,
          accountsFilterSearch: search,
        }),

      resetAccountsFilters: () =>
        set({
          accountsFilterType: '',
          accountsFilterCategory: '',
          accountsFilterSearch: '',
        }),
    }),
    { name: STORAGE_KEY }
  )
);
