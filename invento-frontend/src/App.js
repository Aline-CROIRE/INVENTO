import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GlobalStyles } from './styles/GlobalStyles';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Users from './pages/Users';
import SetupPassword from './pages/SetupPassword';
import Sales from './pages/Sales';
import Sustainability from './pages/Sustainablity';

const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return <AppLayout>{children}</AppLayout>;
};

function App() {
  return (
    <AuthProvider>
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          
          <Route path="/dashboard" element={
            <RoleRoute roles={['ADMIN', 'OWNER', 'WORKER']}><Dashboard /></RoleRoute>
          } />
          
          <Route path="/inventory" element={
            <RoleRoute roles={['OWNER', 'WORKER']}><Inventory /></RoleRoute>
          } />

          <Route path="/users" element={
            <RoleRoute roles={['ADMIN', 'OWNER']}><Users /></RoleRoute>
          } />
          <Route path="/sustainability" element={
  <RoleRoute roles={['OWNER']}>
    <Sustainability />
  </RoleRoute>
} />

          <Route path="/sales" element={
  <RoleRoute roles={['OWNER', 'WORKER']}>
    <Sales />
  </RoleRoute>
} />
          
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;