import { useEffect } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';

/**
 * Sets document dir and lang when locale changes (for RTL Arabic).
 */
export function LanguageDirection() {
  const locale = useLanguageStore((s) => s.locale);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', locale === 'ar' ? 'ar' : 'en');
  }, [locale]);

  return null;
}
