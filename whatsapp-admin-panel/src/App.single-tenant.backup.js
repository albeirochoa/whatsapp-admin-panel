import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import './styles/App.css';

function AppContent() {
  const { user, loading, handleLogin, handleLogout } = useAuth();

  if (!user) {
    return <LoginScreen onLogin={handleLogin} loading={loading} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
