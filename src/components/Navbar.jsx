import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import './Navbar.css';

export function Navbar() {
  const { user, role, logout } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const displayName = user === 'Victorious' ? 'Mohammed' : (user || t('common.user'));

  return (
    <nav className="navbar" aria-label="User and actions">
      <div className="navbar-items">
        <span className="navbar-user">{displayName}</span>
        <span className="navbar-role">{role === 'Admin' ? t('roles.admin') : t('roles.resident')}</span>
        <button
          type="button"
          className="navbar-logout"
          onClick={handleLogout}
          aria-label={t('common.logOut')}
        >
          <LogOut size={18} />
          <span>{t('common.logOut')}</span>
        </button>
        <div className="navbar-language">
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
