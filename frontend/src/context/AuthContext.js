import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [patientProfileId, setPatientProfileId] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      return u?.patientProfile || null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // On mount — verify token and refresh user data (restores patientProfile after refresh)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    api.get('/auth/me')
      .then(({ data }) => {
        const freshUser = data.user;
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        if (freshUser.patientProfile) {
          setPatientProfileId(freshUser.patientProfile);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setPatientProfileId(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    if (data.user.patientProfile) {
      setPatientProfileId(data.user.patientProfile);
    }
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setPatientProfileId(null);
  };

  return (
    <AuthContext.Provider value={{ user, patientProfileId, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
