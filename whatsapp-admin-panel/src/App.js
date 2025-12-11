import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProvider, useUser } from './contexts/UserContext';
import PublicRegistration from './components/PublicRegistration';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { ROLES } from './constants/plans';
import './styles/App.css';
import './styles/Registration.css';
import './styles/SuperAdmin.css';
import './styles/MultiTenant.css';

function AppContent() {
  const { user, loading, handleLogin, handleLogout } = useAuth();
  const { userData, loading: userLoading } = useUser();
  const [showRegistration, setShowRegistration] = useState(false);
  const [viewMode, setViewMode] = useState('admin'); // 'admin' | 'app'

  // Handle login with plan selection
  const handleLoginWithPlan = async (plan) => {
    await handleLogin(plan);
  };

  // Loading state
  if (loading || (user && userLoading)) {
    return (
      <div className="app-container">
        <div className="login-screen">
          <div className="login-card">
            <p style={{ color: '#64748b' }}>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in - show registration or login
  if (!user) {
    if (showRegistration) {
      return (
        <div className="app-container">
          <PublicRegistration onLogin={handleLoginWithPlan} />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => setShowRegistration(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Ya tengo cuenta
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="app-container">
        <LoginScreen onLogin={() => handleLogin()} loading={false} />
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setShowRegistration(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Crear cuenta nueva
          </button>
        </div>
      </div>
    );
  }

  // Logged in - route based on role
  if (userData?.role === ROLES.SUPER_ADMIN && viewMode === 'admin') {
    return (
      <SuperAdminDashboard
        user={user}
        onLogout={handleLogout}
        onSwitchView={() => setViewMode('app')}
      />
    );
  }

  // Regular user (admin or client) or Super Admin in 'app' mode
  return (
    <Dashboard
      user={user}
      userData={userData}
      onLogout={handleLogout}
      onSwitchView={() => setViewMode('admin')}
      isSuperAdmin={userData?.role === ROLES.SUPER_ADMIN}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      {({ user }) => (
        <UserProvider firebaseUser={user}>
          <div className="app-container">
            <AppContent />
          </div>
        </UserProvider>
      )}
    </AuthProvider>
  );
}

export default App;
