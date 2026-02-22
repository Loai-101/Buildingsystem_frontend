import { useTranslation } from '../i18n';
import './LanguageSwitcher.css';

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="language-switcher" role="group" aria-label="Language">
      <button
        type="button"
        className={`language-btn ${locale === 'en' ? 'language-btn--active' : ''}`}
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        aria-label="English"
      >
        EN
      </button>
      <button
        type="button"
        className={`language-btn ${locale === 'ar' ? 'language-btn--active' : ''}`}
        onClick={() => setLocale('ar')}
        aria-pressed={locale === 'ar'}
        aria-label="Arabic"
      >
        عربي
      </button>
    </div>
  );
}
