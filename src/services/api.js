import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '') || '/api';
const isLocalBackend = baseURL.includes('localhost') || baseURL.includes('127.0.0.1');
// Deploy (e.g. Render) can have cold start; 60s timeout so user gets clear error instead of endless loading. Local: no timeout.
const timeout = isLocalBackend ? undefined : 60000;

// Safeguard: production build must use full hosted API URL (local frontend → local backend; hosted → hosted backend)
if (import.meta.env.PROD) {
  if (isLocalBackend) {
    console.error('[API] Production build is using a local backend URL. Set VITE_API_URL to your hosted API (e.g. in .env.production or Vercel env).');
  } else if (!baseURL.startsWith('http')) {
    console.error('[API] Production build has no full API URL (got relative or empty). Set VITE_API_URL in .env.production or Vercel env.');
  }
}

const api = axios.create({
  baseURL,
  timeout,
  headers: { 'Content-Type': 'application/json' },
});

/** Log every API error to console so you can see what failed. */
function logApiError(err, config) {
  const method = (config?.method || 'get').toUpperCase();
  const url = config?.url != null ? config.url : config?.baseURL || 'unknown';
  const fullUrl = config?.baseURL ? `${config.baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}` : url;
  const status = err.response?.status;
  const serverMsg = err.response?.data?.error || err.response?.data?.message;
  const message = err.code === 'ERR_NETWORK'
    ? 'Network error (backend unreachable or CORS)'
    : err.code === 'ECONNABORTED'
      ? 'Request timeout'
      : serverMsg || err.message || 'Unknown error';
  console.error(
    `[API Error] ${method} ${fullUrl}`,
    status != null ? `→ ${status}` : '',
    '|',
    message
  );
}

// Request interceptor: attach auth token when backend is real
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor: log errors and handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isProposals404 = err.config?.url?.includes('/proposals') && err.response?.status === 404;
    if (!isProposals404) logApiError(err, err.config);
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/** Get a short user-facing message from an API error (for toasts). */
export function getApiErrorMessage(err) {
  if (!err) return '';
  if (err.response?.data?.error && typeof err.response.data.error === 'string') return err.response.data.error;
  if (err.response?.data?.message && typeof err.response.data.message === 'string') return err.response.data.message;
  if (err.code === 'ERR_NETWORK') return 'Cannot reach server. Check backend is running and URL.';
  if (err.code === 'ECONNABORTED') {
    return isLocalBackend
      ? 'Request timed out. Is the backend running? In Buildingsystem_backend run: npm run dev'
      : 'Request timed out. Server may be waking up—try again in a moment.';
  }
  if (err.message && typeof err.message === 'string') return err.message;
  return 'Something went wrong.';
}

export default api;
