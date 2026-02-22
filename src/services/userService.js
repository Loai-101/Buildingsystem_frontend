/**
 * Frontend-only user storage (localStorage).
 * Admin creates accounts; login validates against this list.
 */

const STORAGE_KEY = 'hatten_users';

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveUsers(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const DEFAULT_ADMIN = {
  id: 'seed-admin',
  username: 'Mohammed',
  password: 'M37777614',
  role: 'Admin',
  createdAt: new Date().toISOString(),
};

/** Ensure default admin Mohammed exists (add if missing, so login always works) */
function ensureDefaultAdmin() {
  const users = loadUsers();
  const hasMohammed = users.some(
    (u) => String(u.username).toLowerCase() === 'mohammed'
  );
  if (!hasMohammed) {
    saveUsers([...users, { ...DEFAULT_ADMIN, createdAt: new Date().toISOString() }]);
  }
}

/** Get all users (passwords included for internal use; UI should never display them) */
export function getUsers() {
  ensureDefaultAdmin();
  return loadUsers();
}

/** Create a new user. Returns the created user or throws if username exists. */
export function addUser({ username, password, role }) {
  const trimmed = (username || '').trim();
  const pass = password || '';
  if (!trimmed) throw new Error('Username is required');
  if (!pass) throw new Error('Password is required');
  const users = loadUsers();
  if (users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Username already exists');
  }
  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    username: trimmed,
    password: pass,
    role: role === 'Admin' ? 'Admin' : 'Resident',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { ...newUser, password: undefined };
}

/** Validate credentials. Returns { user, role } or null. */
export function validateUser(username, password) {
  const users = getUsers();
  const un = (username || '').trim();
  const pw = (password || '').trim();
  const u = users.find(
    (x) => String(x.username).toLowerCase() === un.toLowerCase()
  );
  if (!u || u.password !== pw) return null;
  return { user: u.username, role: u.role };
}
