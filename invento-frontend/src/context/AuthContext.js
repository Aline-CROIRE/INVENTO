import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- INITIALIZE SESSION ---
  useEffect(() => {
    const storedUser = localStorage.getItem('invento_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    setLoading(false);
  }, []);

  // --- LOGIN PROTOCOL ---
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('invento_token', data.token);
    localStorage.setItem('invento_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  // --- NEW: IDENTITY SYNC PROTOCOL ---
  // This updates the user state and local storage without logging the user out
  const updateUser = (newData) => {
    const updatedUser = { ...user, ...newData };
    setUser(updatedUser); // Update UI instantly
    localStorage.setItem('invento_user', JSON.stringify(updatedUser)); // Persist for refresh
  };

  // --- LOGOUT PROTOCOL ---
  const logout = () => {
    localStorage.removeItem('invento_token');
    localStorage.removeItem('invento_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);