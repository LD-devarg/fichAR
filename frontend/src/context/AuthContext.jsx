import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Al abrir la app, validar si hay token. Si lo hay, pedir los datos del usuario al backend.
    const token = localStorage.getItem('access_token');
    if (token) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.get('usuarios/me/');
      setUser(response.data);
    } catch (error) {
      console.error("Error al cargar perfil", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // 1. Pedir tokens a SimpleJWT
      const { data } = await api.post('token/', { username, password });
      
      // 2. Guardarlos localmente
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      // 3. Cargar el rol e info del usuario
      await loadUserProfile();
      
      return { success: true };
    } catch (error) {
      console.error("Login falló", error.response?.data);
      return { success: false, error: error.response?.data?.detail || "Contraseña o usuario incorrecto" };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  // Helper para las distintas visuales
  const isAdmin = user?.is_superuser || user?.nombres_grupos?.includes('Admin');
  const isEmpleado = user?.nombres_grupos?.includes('Empleado');

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isEmpleado }}>
      {children}
    </AuthContext.Provider>
  );
};
