/**
 * User service – uses backend API (auth required for getUsers/addUser).
 */
import api from './api';

/** Validate credentials via API. Returns { user, role, token } or null. Throws on network error. */
export async function validateUser(username, password) {
  const { data } = await api.post('/auth/login', {
    username: (username || '').trim(),
    password: (password || '').trim(),
  });
  if (!data || !data.token) return null;
  return { user: data.user, role: data.role, token: data.token };
}

/** Get all users (Admin). Returns array of { id, username, role, createdAt }. */
export async function getUsers() {
  const { data } = await api.get('/users');
  return Array.isArray(data) ? data : [];
}

/** Create a new user (Admin). Returns the created user or throws. */
export async function addUser({ username, password, role }) {
  const trimmed = (username || '').trim();
  const pass = password || '';
  if (!trimmed) throw new Error('Username is required');
  if (!pass) throw new Error('Password is required');
  const { data } = await api.post('/users', {
    username: trimmed,
    password: pass,
    role: role === 'Admin' ? 'Admin' : 'Resident',
  });
  return { ...data, password: undefined };
}

/** Update user (Admin). Pass only fields to update: displayName, password, profileImage, isActive. */
export async function updateUser(id, payload) {
  const { data } = await api.patch(`/users/${id}`, payload);
  return data;
}

/** Get login history for a user (Admin). */
export async function getLoginHistory(id) {
  const { data } = await api.get(`/users/${id}/login-history`);
  return Array.isArray(data) ? data : [];
}

/** Set active state for one user or all (Admin). { userId, active } or { all: true, active }. */
export async function setBulkActive({ userId, all, active }) {
  const { data } = await api.patch('/users/bulk/active', { userId, all, active: !!active });
  return data;
}
