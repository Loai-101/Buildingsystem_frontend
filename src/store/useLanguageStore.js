import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'hatten_language';

export const useLanguageStore = create(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale: locale === 'ar' ? 'ar' : 'en' }),
    }),
    { name: STORAGE_KEY }
  )
);
