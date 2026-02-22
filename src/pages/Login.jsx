import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { validateUser } from '../services/userService';
import { useTranslation } from '../i18n';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import './Login.css';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const login = useAuthStore((s) => s.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const from = location.state?.from?.pathname || '/dashboard';

  function onSubmit(data) {
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
    const auth = validateUser(username, password);
    if (!auth) {
      toast.error(t('login.invalidCredentials'));
      return;
    }
    login(auth.user, auth.role);
    toast.success(t('login.welcome', { name: auth.user }));
    navigate(from, { replace: true });
  }

  return (
    <div className="login-page">
      <div className="login-card">
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
