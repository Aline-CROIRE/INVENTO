import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GlobalStyles } from './styles/GlobalStyles';
import { Loader } from 'lucide-react';

// --- LAYOUT ---
import AppLayout from './components/Layout/AppLayout';

// --- LAZY LOADED PAGES (Performance Enhancement) ---
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Sales = lazy(() => import('./pages/Sales'));
const Expenses = lazy(() => import('./pages/Expenses')); // NEW: Expenses Page
const Users = lazy(() => import('./pages/Users'));
const Login = lazy(() => import('./pages/Login'));
const SetupPassword = lazy(() => import('./pages/SetupPassword'));
const Sustainability = lazy(() => import('./pages/Sustainablity'));
const Settings = lazy(() => import('./pages/Settings')); 

// --- GLOBAL LOADING COMPONENT ---
const FullPageLoader = () => (
  <LoadingWrapper>
    <div className="loader-box">
      <Loader className="spin" size={42} color="#00B0FF" />
      <p>Synchronizing Neural Link...</p>
    </div>
  </LoadingWrapper>
);

// --- ENHANCED PROTECTION WRAPPER ---
const RoleRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  
  if (!user) return <Navigate to="/login" replace />;

  // Redirect if user doesn't have permission for this specific node
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AppLayout>
      <Suspense fallback={<FullPageLoader />}>
        {children}
      </Suspense>
    </AppLayout>
  );
};

function App() {
  return (
    <AuthProvider>
      <GlobalStyles />
      <BrowserRouter>
        <Suspense fallback={<FullPageLoader />}>
          <Routes>
            {/* PUBLIC NODES */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup-password" element={<SetupPassword />} />
            
            {/* PROTECTED COMMAND NODES */}
            <Route path="/dashboard" element={
              <RoleRoute roles={['ADMIN', 'OWNER', 'WORKER']}>
                <Dashboard />
              </RoleRoute>
            } />
            
            <Route path="/inventory" element={
              <RoleRoute roles={['ADMIN', 'OWNER', 'WORKER']}>
                <Inventory />
              </RoleRoute>
            } />

            <Route path="/sales" element={
              <RoleRoute roles={['OWNER', 'WORKER']}>
                <Sales />
              </RoleRoute>
            } />

            {/* NEW EXPENSES ROUTE */}
            <Route path="/expenses" element={
              <RoleRoute roles={['OWNER', 'WORKER']}>
                <Expenses />
              </RoleRoute>
            } />

            <Route path="/users" element={
              <RoleRoute roles={['ADMIN', 'OWNER']}>
                <Users />
              </RoleRoute>
            } />

            <Route path="/sustainability" element={
              <RoleRoute roles={['ADMIN', 'OWNER']}>
                <Sustainability />
              </RoleRoute>
            } />
            
            <Route path="/settings" element={
              <RoleRoute roles={['ADMIN', 'OWNER', 'WORKER']}>
                <Settings />
              </RoleRoute>
            } />

            {/* REDIRECTS */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

// --- STYLES ---

const LoadingWrapper = styled.div`
  position: fixed;
  inset: 0;
  background: #04090E;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  .loader-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    
    .spin {
      animation: spin 1.5s linear infinite;
      filter: drop-shadow(0 0 10px #00B0FF);
    }
    
    p {
      color: #64748b;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 3px;
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default App;