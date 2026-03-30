import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('aidlink_user');
    const token = localStorage.getItem('aidlink_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
      // Refresh user data
      api.get('/auth/me').then(res => {
        setUser(res.data);
        localStorage.setItem('aidlink_user', JSON.stringify(res.data));
      }).catch(() => {
        localStorage.removeItem('aidlink_token');
        localStorage.removeItem('aidlink_user');
        setUser(null);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('aidlink_token', res.data.token);
    localStorage.setItem('aidlink_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('aidlink_token', res.data.token);
    localStorage.setItem('aidlink_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('aidlink_token');
    localStorage.removeItem('aidlink_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
