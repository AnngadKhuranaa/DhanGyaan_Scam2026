import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

/**
 * The access token lives in memory only (not localStorage), so an XSS bug
 * can't steal a long-lived credential. On a page reload it is re-issued from
 * the httpOnly refresh cookie via /auth/refresh.
 */
let accessToken = null;
let onSessionExpired = () => {};

export const setAccessToken = (token) => {
  accessToken = token;
};
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // send the refresh cookie to /api/auth/*
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/**
 * Single-flight refresh: if five requests fail with 401 at once, only ONE
 * /auth/refresh call is made and all five wait for it, then retry once.
 */
let refreshPromise = null;
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true, timeout: 15_000 })
      .then((res) => {
        setAccessToken(res.data.data.accessToken);
        return res.data.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/demo', '/auth/logout'];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = AUTH_PATHS.some((p) => original?.url?.startsWith(p));

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true; // retry at most once
      try {
        await refreshSession();
        return api(original);
      } catch {
        setAccessToken(null);
        onSessionExpired();
      }
    }
    return Promise.reject(error);
  }
);

/** Unwrap the server's { success, data, message } envelope. */
export const unwrap = (promise) => promise.then((res) => res.data.data);

/** Human-readable message for any request error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (error?.message === 'Network Error') return 'Cannot reach the server. Check your connection and that the API is running.';
  return fallback;
}

/** Field-level errors from express-validator, keyed by field name. */
export function getFieldErrors(error) {
  const list = error?.response?.data?.data?.errors;
  if (!Array.isArray(list)) return {};
  return Object.fromEntries(list.map((e) => [e.field, e.message]));
}

export default api;
