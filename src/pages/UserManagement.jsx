import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { Card, CardHeader, CardTitle, CardBody } from '../components/Cards/Card';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { Modal } from '../components/Modals/Modal';
import { ConfirmDialog } from '../components/Modals/ConfirmDialog';
import {
  getUsers,
  addUser,
  updateUser,
  getLoginHistory,
  setBulkActive,
} from '../services/userService';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../i18n';
import { UserPlus, User, Camera, History, Eye, EyeOff } from 'lucide-react';
import './UserManagement.css';

export function UserManagement() {
  const { t } = useTranslation();
  const role = useAuthStore((s) => s.role);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', variant: 'warning', confirmLabel: '', onConfirm: null });

  const isAdminRole = role != null && String(role).toLowerCase() === 'admin';
  const roleKnown = role !== null && role !== undefined;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { username: '', password: '', role: 'Resident' },
  });

  const loadUsers = useCallback(async () => {
    try {
      const list = await getUsers();
      setUsers(Array.isArray(list) ? list : []);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function onAddUser(data) {
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
      await addUser({
        username,
        password,
        role: data.role === 'Admin' ? 'Admin' : 'Resident',
      });
      toast.success(t('userManagement.userCreated'));
      reset({ username: '', password: '', role: 'Resident' });
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      toast.error(msg === 'Username already exists' ? t('userManagement.usernameExists') : msg);
    }
  }

  function openUserDetail(user) {
    setSelectedUser(user);
    setEditDisplayName(user.displayName || '');
    setEditPassword('');
    setEditImage(null);
    setLoginHistory([]);
    setHistoryLoading(true);
    getLoginHistory(user.id)
      .then(setLoginHistory)
      .catch(() => setLoginHistory([]))
      .finally(() => setHistoryLoading(false));
  }

  function closeUserDetail() {
    setSelectedUser(null);
    setEditDisplayName('');
    setEditPassword('');
    setEditImage(null);
    setLoginHistory([]);
    setShowChangePassword(false);
  }

  async function onSaveUserDetail() {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload = {
        displayName: (editDisplayName || '').trim(),
        isActive: selectedUser.isActive !== false,
      };
      if (editPassword.trim()) payload.password = editPassword.trim();
      if (editImage) payload.profileImage = editImage;
      await updateUser(selectedUser.id, payload);
      toast.success(t('userManagement.userUpdated'));
      const updated = users.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              displayName: payload.displayName ?? u.displayName,
              profileImage: payload.profileImage !== undefined ? payload.profileImage : u.profileImage,
              isActive: payload.isActive !== undefined ? payload.isActive : u.isActive,
            }
          : u
      );
      setUsers(updated);
      setSelectedUser((prev) =>
        prev && prev.id === selectedUser.id
          ? {
              ...prev,
              displayName: payload.displayName ?? prev.displayName,
              profileImage: payload.profileImage !== undefined ? payload.profileImage : prev.profileImage,
              isActive: payload.isActive !== undefined ? payload.isActive : prev.isActive,
            }
          : prev
      );
      setEditPassword('');
      setEditImage(null);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleUserActive(user) {
    const next = !(user.isActive !== false);
    setConfirm({
      open: true,
      title: next ? t('userManagement.setActive') : t('userManagement.setInactive'),
      message: next ? t('userManagement.setActiveConfirm') : t('userManagement.setInactiveConfirm'),
      variant: next ? 'success' : 'warning',
      confirmLabel: next ? t('userManagement.setActive') : t('userManagement.setInactive'),
      onConfirm: () => {
        setBulkActive({ userId: user.id, active: next })
          .then(() => {
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? { ...u, isActive: next } : u))
            );
            if (selectedUser?.id === user.id) {
              setSelectedUser((prev) => (prev ? { ...prev, isActive: next } : null));
            }
            toast.success(next ? t('userManagement.setActive') : t('userManagement.setInactive'));
          })
          .catch(() => toast.error(t('common.noData')))
          .finally(() => setConfirm((c) => ({ ...c, open: false })));
      },
    });
  }

  function onActivateAll() {
    setConfirm({
      open: true,
      title: t('userManagement.activateAll'),
      message: t('userManagement.activateAllConfirm'),
      variant: 'success',
      confirmLabel: t('userManagement.activateAll'),
      onConfirm: () => {
        setBulkActive({ all: true, active: true })
          .then(() => {
            loadUsers();
            if (selectedUser) setSelectedUser((prev) => (prev ? { ...prev, isActive: true } : null));
            toast.success(t('userManagement.activateAll'));
          })
          .catch(() => toast.error(t('common.noData')))
          .finally(() => setConfirm((c) => ({ ...c, open: false })));
      },
    });
  }

  function onDeactivateAll() {
    setConfirm({
      open: true,
      title: t('userManagement.deactivateAll'),
      message: t('userManagement.deactivateAllConfirm'),
      variant: 'warning',
      confirmLabel: t('userManagement.deactivateAll'),
      onConfirm: () => {
        setBulkActive({ all: true, active: false })
          .then(() => {
            loadUsers();
            if (selectedUser) setSelectedUser((prev) => (prev ? { ...prev, isActive: false } : null));
            toast.success(t('userManagement.deactivateAll'));
          })
          .catch(() => toast.error(t('common.noData')))
          .finally(() => setConfirm((c) => ({ ...c, open: false })));
      },
    });
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setEditImage(reader.result);
    reader.readAsDataURL(file);
  }

  function displayNameFor(user) {
    return (user.displayName || user.username || '').trim() || user.username;
  }

  function imageFor(user, fallbackToEdit = false) {
    if (fallbackToEdit && selectedUser?.id === user?.id && editImage) return editImage;
    return user?.profileImage || '';
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
          {users.length > 0 && (
            <div className="user-management-bulk-actions">
              <Button type="button" variant="outline" className="btn--sm" onClick={onActivateAll}>
                {t('userManagement.activateAll')}
              </Button>
              <Button type="button" variant="outline" className="btn--sm" onClick={onDeactivateAll}>
                {t('userManagement.deactivateAll')}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardBody>
          {users.length === 0 ? (
            <p className="user-management-no-users">{t('userManagement.noUsers')}</p>
          ) : (
            <div className="user-management-grid" role="list" aria-label={t('userManagement.usersList')}>
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className={`user-management-card ${u.isActive === false ? 'user-management-card--inactive' : ''}`}
                  onClick={() => openUserDetail(u)}
                  role="listitem"
                >
                  <div className="user-management-card-avatar">
                    {u.profileImage ? (
                      <img src={u.profileImage} alt="" />
                    ) : (
                      <User size={32} aria-hidden="true" />
                    )}
                  </div>
                  <span className="user-management-card-name">{displayNameFor(u)}</span>
                  <span className="user-management-card-meta">
                    {u.role === 'Admin' ? t('roles.admin') : t('roles.resident')}
                    {u.isActive === false && ` · ${t('userManagement.inactive')}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm((c) => ({ ...c, open: false }))}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
        variant={confirm.variant}
        confirmLabel={confirm.confirmLabel}
        cancelLabel={t('common.cancel')}
      />

      <Modal
        open={!!selectedUser}
        onClose={closeUserDetail}
        title={t('userManagement.userDetails')}
      >
        {selectedUser && (
          <div className="user-management-detail">
            <div className="user-management-detail-image-row">
              <div className="user-management-detail-avatar">
                {imageFor(selectedUser, true) ? (
                  <img src={imageFor(selectedUser, true)} alt="" />
                ) : (
                  <User size={48} aria-hidden="true" />
                )}
              </div>
              <label className="user-management-upload-btn">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="visually-hidden"
                />
                <Camera size={18} aria-hidden="true" />
                {t('userManagement.uploadImage')}
              </label>
            </div>

            <FormField label={t('userManagement.displayName')}>
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder={selectedUser.username}
              />
            </FormField>

            <FormField label={t('userManagement.username')}>
              <input type="text" value={selectedUser.username} readOnly disabled className="user-management-readonly" />
            </FormField>

            <FormField label={t('userManagement.changePassword')}>
              <div className="user-management-password-wrap">
                <input
                  type={showChangePassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="user-management-password-input"
                />
                <button
                  type="button"
                  className="user-management-password-eye"
                  onClick={() => setShowChangePassword((v) => !v)}
                  aria-label={showChangePassword ? t('userManagement.hidePassword') : t('userManagement.showPassword')}
                  title={showChangePassword ? t('userManagement.hidePassword') : t('userManagement.showPassword')}
                >
                  {showChangePassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                </button>
              </div>
            </FormField>

            <div className="user-management-detail-state">
              <span className="user-management-detail-state-label">{t('userManagement.state')}</span>
              <span className="user-management-detail-state-value">
                {selectedUser.isActive !== false ? t('userManagement.active') : t('userManagement.inactive')}
              </span>
              <Button
                type="button"
                variant="outline"
                className="btn--sm"
                onClick={() => toggleUserActive(selectedUser)}
              >
                {selectedUser.isActive !== false ? t('userManagement.setInactive') : t('userManagement.setActive')}
              </Button>
            </div>

            <div className="user-management-detail-history">
              <h3 className="user-management-detail-history-title">
                <History size={18} aria-hidden="true" />
                {t('userManagement.loginHistory')}
              </h3>
              {historyLoading ? (
                <p className="user-management-detail-history-loading">{t('common.loading')}</p>
              ) : loginHistory.length === 0 ? (
                <p className="user-management-detail-history-empty">{t('userManagement.noLoginHistory')}</p>
              ) : (
                <div className="user-management-detail-history-table-wrap">
                  <table className="user-management-detail-history-table" role="grid" aria-label={t('userManagement.loginHistory')}>
                    <thead>
                      <tr>
                        <th scope="col">{t('userManagement.loginHistoryDate')}</th>
                        <th scope="col">{t('userManagement.loginHistoryUserAgent')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginHistory.map((entry, i) => (
                        <tr key={i}>
                          <td>
                            <time dateTime={new Date(entry.at).toISOString()}>
                              {new Date(entry.at).toLocaleString()}
                            </time>
                          </td>
                          <td className="user-management-detail-history-ua-cell" title={entry.userAgent || ''}>
                            {entry.userAgent ? (entry.userAgent.length > 50 ? `${entry.userAgent.slice(0, 50)}…` : entry.userAgent) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="user-management-detail-actions">
              <Button type="button" variant="outline" onClick={closeUserDetail}>
                {t('common.cancel')}
              </Button>
              <Button onClick={onSaveUserDetail} disabled={saving}>
                {saving ? t('common.loading') : t('userManagement.save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
