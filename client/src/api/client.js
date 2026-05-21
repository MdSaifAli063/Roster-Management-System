import axios from 'axios';
import { getApiBaseUrl } from '../lib/apiConfig';

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthBootstrap = url.includes('/auth/me') || url.includes('/auth/login');
    if (err.response?.status === 401 && !isAuthBootstrap) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const publicPaths = ['/', '/login'];
      if (!publicPaths.includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
