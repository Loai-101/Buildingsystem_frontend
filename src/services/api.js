import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Axios instance for Hatten Building API.
 * Replace baseURL with real backend when available.
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach auth token when backend is real
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Response interceptor: handle 401 and redirect to login when backend is real
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
