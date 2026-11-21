import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('med_inventory_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('med_inventory_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('med_inventory_user');
    }
  }, [user]);

  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.register(userData);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('med_inventory_user');
  }, []);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'med_inventory_user') {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      logout();
    });

    if (!user) return;

    let isMounted = true;
    const verifySession = async () => {
      try {
        await api.getMe(user);
      } catch (err) {
        if (isMounted && err.message && (err.message.includes('deleted') || err.message.includes('Authentication') || err.message.includes('401'))) {
          logout();
        }
      }
    };

    verifySession();

    const interval = setInterval(verifySession, 120000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        isAdmin: user?.role === 'admin'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
