import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken, getToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch (err) {
        console.warn('Session verification failed, resetting token:', err.message);
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.login(email, password);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (payload) => {
    setError(null);
    try {
      const res = await api.register(payload);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const switchPersona = async (role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.switchPersona(role);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
    }
  };

  const isStaff = user && ['super_admin', 'admin', 'moderator'].includes(user.role);
  const isAdmin = user && ['super_admin', 'admin'].includes(user.role);
  const isSuperAdmin = user && user.role === 'super_admin';
  const isModerator = user && user.role === 'moderator';
  const isMember = user && user.role === 'member';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        switchPersona,
        refreshUser,
        isStaff,
        isAdmin,
        isSuperAdmin,
        isModerator,
        isMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
