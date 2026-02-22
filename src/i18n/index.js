import { useLanguageStore } from '../store/useLanguageStore';
import { en, ar } from './translations';

const messages = { en, ar };

function getNested(obj, path) {
  return path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
}

/**
 * Returns translation for key. Supports dot notation (e.g. 'login.title').
 * Replace {name} with optional params: t('login.welcome', { name: 'Ali' })
 */
export function t(locale, key, params = {}) {
  const str = getNested(messages[locale] || messages.en, key) || getNested(messages.en, key) || key;
  if (typeof str !== 'string') return key;
  return Object.keys(params).reduce((s, k) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]), str);
}

export function useTranslation() {
  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);
  return {
    t: (key, params) => t(locale, key, params),
    locale,
    setLocale,
    isRtl: locale === 'ar',
  };
}

export { en, ar };
