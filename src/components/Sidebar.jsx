import { useState, useEffect, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Wrench, Calendar, Vote, Users, Menu, X } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuthStore } from '../store/useAuthStore';
import './Sidebar.css';

const allNavItems = [
  { to: '/dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, adminOnly: true },
  { to: '/accounts', labelKey: 'sidebar.accounts', icon: Wallet },
  { to: '/maintenance', labelKey: 'sidebar.maintenance', icon: Wrench },
  { to: '/majlis-booking', labelKey: 'sidebar.majlisBooking', icon: Calendar },
  { to: '/vote', labelKey: 'sidebar.vote', icon: Vote },
  { to: '/users', labelKey: 'sidebar.userManagement', icon: Users, adminOnly: true },
];

export function Sidebar() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.role);
  const admin = role === 'Admin';
  const navItems = useMemo(
    () => allNavItems.filter((item) => !item.adminOnly || admin),
    [admin]
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-text">{t('sidebar.brand')}</span>
          <button
            type="button"
            className="sidebar-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label={t('common.openMenu')}
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={24} aria-hidden="true" />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              end={to === '/dashboard'}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile menu overlay: all pages with labels */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'mobile-menu-overlay--open' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />
      <div className={`mobile-menu ${mobileMenuOpen ? 'mobile-menu--open' : ''}`} role="dialog" aria-label="Navigation menu">
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">Menu</span>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <nav className="mobile-menu-nav" aria-label="Main navigation">
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `mobile-menu-link ${isActive ? 'mobile-menu-link--active' : ''}`}
              end={to === '/dashboard'}
              onClick={closeMobileMenu}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
}
