'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('pg_token');
    const savedUser = localStorage.getItem('pg_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('pg_token', authToken);
    localStorage.setItem('pg_user', JSON.stringify(userData));
  };

  const updateUser = (updates) => {
    setUser((currentUser) => {
      const nextUser = { ...(currentUser || {}), ...updates };
      localStorage.setItem('pg_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pg_token');
    localStorage.removeItem('pg_user');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { }
  };

  const authFetch = async (url, options = {}) => {
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
