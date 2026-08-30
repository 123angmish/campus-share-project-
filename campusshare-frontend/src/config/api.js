import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const ACCESS_TOKEN_KEY = 'campusshare_access_token';
const USER_KEY = 'campusshare_user';
const REMEMBER_KEY = 'campusshare_remember';

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token, persistent = true) => {
  if (token) {
    if (persistent) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      localStorage.setItem(REMEMBER_KEY, 'true');
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    } else {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REMEMBER_KEY);
    }
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user, persistent = true) => {
  if (user) {
    const str = JSON.stringify(user);
    if (persistent) {
      localStorage.setItem(USER_KEY, str);
      sessionStorage.removeItem(USER_KEY);
    } else {
      sessionStorage.setItem(USER_KEY, str);
      localStorage.removeItem(USER_KEY);
    }
  } else {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
};

export const isRememberMe = () => {
  return localStorage.getItem(REMEMBER_KEY) === 'true';
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  timeout: 20000
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise = null;
export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true, timeout: 20000 })
      .then((response) => {
        const persistent = isRememberMe();
        setAccessToken(response.data.accessToken, persistent);
        if (response.data.user) {
          setStoredUser(response.data.user, persistent);
        }
        return response.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint =
      original?.url?.includes('/auth/login') ||
      original?.url?.includes('/auth/signup') ||
      original?.url?.includes('/auth/refresh') ||
      original?.url?.includes('/auth/forgot-password') ||
      original?.url?.includes('/auth/reset-password');

    const isUnauth =
      error.response?.status === 401 ||
      (error.response?.status === 403 && !original?.url?.includes('/api/admin'));

    if (isUnauth && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const session = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${session.accessToken}`;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        setStoredUser(null);
        window.dispatchEvent(new Event('campusshare:session-expired'));
        const cleanErr = new Error(
          error.response?.data?.message || 'Your session expired. Please sign in again.'
        );
        return Promise.reject(cleanErr);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
