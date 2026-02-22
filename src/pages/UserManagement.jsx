import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { Card, CardHeader, CardTitle, CardBody } from '../components/Cards/Card';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { getUsers, addUser } from '../services/userService';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../i18n';
import { UserPlus, User } from 'lucide-react';
import './UserManagement.css';

export function UserManagement() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.role);
  const [users, setUsers] = useState([]);

  const isAdminRole = role != null && String(role).toLowerCase() === 'admin';
  const roleKnown = role !== null && role !== undefined;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { username: '', password: '', role: 'Resident' },
  });

  function loadUsers() {
    const list = getUsers();
    setUsers(list.map(({ password, ...u }) => u));
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function onAddUser(data) {
    const username = (data.username || '').trim();
    const password = (data.password || '').trim();
    if (!username) {
      toast.error(t('login.usernameRequired'));
      return;
    }
    if (!password) {
      toast.error(t('login.passwordRequired'));
      return;
    }
    try {
      addUser({
        username,
        password,
        role: data.role === 'Admin' ? 'Admin' : 'Resident',
      });
      toast.success(t('userManagement.userCreated'));
      reset({ username: '', password: '', role: 'Resident' });
      loadUsers();
    } catch (err) {
      toast.error(err.message === 'Username already exists' ? t('userManagement.usernameExists') : err.message);
    }
  }

  if (roleKnown === false) {
    return (
      <div className="user-management-page">
        <Header title={t('userManagement.title')} />
        <p className="user-management-intro">{t('common.loading')}</p>
      </div>
    );
  }

  if (roleKnown && !isAdminRole) {
    return (
      <div className="user-management-page">
        <Header title={t('userManagement.title')} />
        <p className="user-management-intro user-management-access-denied">
          {t('userManagement.accessDenied')}
        </p>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <Header title={t('userManagement.title')} />
      <p className="user-management-intro">{t('userManagement.subtitle')}</p>

      <Card className="user-management-form-card">
        <CardHeader>
          <CardTitle>
            <UserPlus size={20} aria-hidden="true" />
            {t('userManagement.addUser')}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit(onAddUser)} className="user-management-form" noValidate>
            <div className="user-management-form-row">
              <FormField label={t('userManagement.username')} required error={errors.username?.message ? t('login.usernameRequired') : undefined}>
                <input
                  type="text"
                  id="new-username"
                  autoComplete="off"
                  placeholder={t('login.usernamePlaceholder')}
                  {...register('username', { required: true })}
                />
              </FormField>
              <FormField label={t('userManagement.password')} required error={errors.password?.message ? t('login.passwordRequired') : undefined}>
                <input
                  type="password"
                  id="new-password"
                  autoComplete="new-password"
                  placeholder={t('login.passwordPlaceholder')}
                  {...register('password', { required: true })}
                />
              </FormField>
              <FormField label={t('userManagement.role')}>
                <select id="new-role" {...register('role')} aria-label={t('userManagement.role')}>
                  <option value="Resident">{t('roles.resident')}</option>
                  <option value="Admin">{t('roles.admin')}</option>
                </select>
              </FormField>
            </div>
            <Button type="submit">{t('userManagement.addUser')}</Button>
          </form>
        </CardBody>
      </Card>

      <Card className="user-management-list-card">
        <CardHeader>
          <CardTitle>{t('userManagement.usersList')}</CardTitle>
        </CardHeader>
        <CardBody>
          {users.length === 0 ? (
            <p className="user-management-no-users">{t('userManagement.noUsers')}</p>
          ) : (
            <ul className="user-management-list" aria-label={t('userManagement.usersList')}>
              {users.map((u) => (
                <li key={u.id} className="user-management-item">
                  <User size={18} className="user-management-item-icon" aria-hidden="true" />
                  <span className="user-management-item-name">{u.username}</span>
                  <span className="user-management-item-role">{u.role === 'Admin' ? t('roles.admin') : t('roles.resident')}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
