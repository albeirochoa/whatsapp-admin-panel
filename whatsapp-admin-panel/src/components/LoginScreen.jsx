import React from 'react';
import { WhatsAppIcon, GoogleIcon } from './Icons';

const LoginScreen = ({ onLogin, loading }) => {
  if (loading) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">
            <WhatsAppIcon />
          </div>
          <p style={{ color: '#64748b' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <WhatsAppIcon />
        </div>
        <h1 className="login-title">WhatsApp Widget</h1>
        <p className="login-subtitle">Panel de administración para tu widget multi-agente</p>
        <button className="google-btn" onClick={onLogin}>
          <GoogleIcon />
          Continuar con Google
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
