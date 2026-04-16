import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de peticiones: Agrega el Token JWT automáticamente si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de respuestas: Si el token expira (401), se atrapa aquí para forzar re-login
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Para redirigir sin react-router-dom context
    if (window.location.pathname !== '/login') {
       window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;
