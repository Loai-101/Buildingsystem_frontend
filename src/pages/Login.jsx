import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { validateUser } from '../services/userService';
import { getApiErrorMessage } from '../services/api';
import { useTranslation } from '../i18n';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import './Login.css';

const LOGIN_BG_IMAGE = 'https://res.cloudinary.com/dvybb2xnc/image/upload/v1771763410/ChatGPT_Image_Feb_22_2026_03_29_04_PM_rij4pe.png';

export function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  async function onSubmit(data) {
    const username = (data.username || '').trim();
    const password = (data.password || '').trim();
    if (!username) {
      toast.error(t('login.enterUsername'));
      return;
    }
    if (!password) {
      toast.error(t('login.passwordRequired'));
      return;
    }
    try {
      const auth = await validateUser(username, password);
      if (!auth) {
        toast.error(t('login.invalidCredentials'));
        return;
      }
      login(auth.user, auth.role, auth.token);
      toast.success(t('login.welcome', { name: auth.user }));
      const isResident = (auth.role || '').toLowerCase() === 'resident';
      navigate(isResident ? '/accounts' : '/dashboard', { replace: true });
    } catch (err) {
      const isNetwork = err.code === 'ERR_NETWORK' || !err.response;
      if (isNetwork) {
        toast.error(t('login.cannotConnectToServer'));
      } else if (err.response?.status === 401) {
        toast.error(t('login.invalidCredentials'));
      } else if (err.response?.status === 403 && err.response?.data?.error === 'Account is deactivated') {
        toast.error(t('userManagement.accountDeactivated'));
      } else {
        toast.error(getApiErrorMessage(err) || t('login.invalidCredentials'));
      }
    }
  }

  return (
    <div className="login-page" style={{ backgroundImage: `url(${LOGIN_BG_IMAGE})` }}>
      <div className={`login-card ${showForm ? 'login-card-visible' : ''}`}>
        <h1 className="login-title">{t('login.title')}</h1>
        <p className="login-subtitle">{t('login.subtitle')}</p>
        <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
          <FormField label={t('login.username')} required error={errors.username?.message ? t('login.usernameRequired') : undefined}>
            <input
              type="text"
              id="username"
              autoComplete="username"
              placeholder={t('login.usernamePlaceholder')}
              {...register('username', { required: true })}
            />
          </FormField>
          <FormField label={t('login.password')} required error={errors.password?.message ? t('login.passwordRequired') : undefined}>
            <input
              type="password"
              id="password"
              autoComplete="current-password"
              placeholder={t('login.passwordPlaceholder')}
              {...register('password', { required: true })}
            />
          </FormField>
          <Button type="submit" className="login-submit">
            {t('login.signIn')}
          </Button>
          <div className="login-language">
            <LanguageSwitcher />
          </div>
        </form>
      </div>
    </div>
  );
}
