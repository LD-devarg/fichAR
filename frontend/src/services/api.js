import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_BASE_URL
  ?? `${window.location.protocol}//${window.location.hostname}:8000/api/`;

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

const clearSessionAndRedirect = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const refreshAccessToken = async () => {
  const refresh = localStorage.getItem('refresh_token');

  if (!refresh) {
    throw new Error('Missing refresh token');
  }

  const { data } = await axios.post(`${apiBaseURL}token/refresh/`, { refresh });
  localStorage.setItem('access_token', data.access);

  if (data.refresh) {
    localStorage.setItem('refresh_token', data.refresh);
  }

  return data.access;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use((response) => response, async (error) => {
  const originalRequest = error.config;
  const isUnauthorized = error.response?.status === 401;
  const isTokenRequest = originalRequest?.url?.includes('token/');

  if (!isUnauthorized || originalRequest?._retry || isTokenRequest) {
    if (isUnauthorized) clearSessionAndRedirect();
    return Promise.reject(error);
  }

  originalRequest._retry = true;

  try {
    refreshPromise = refreshPromise || refreshAccessToken();
    const newAccessToken = await refreshPromise;
    refreshPromise = null;

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  } catch (refreshError) {
    refreshPromise = null;
    clearSessionAndRedirect();
    return Promise.reject(refreshError);
  }
});

export default api;
