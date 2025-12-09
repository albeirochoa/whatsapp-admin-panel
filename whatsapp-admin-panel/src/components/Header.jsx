import React from 'react';
import { WhatsAppIcon } from './Icons';

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <WhatsAppIcon />
        </div>
        <span className="header-title">Widget Admin</span>
      </div>
      <div className="header-right">
        <div className="user-info">
          <img src={user.photoURL} alt="" className="user-avatar" />
          <span className="user-name">{user.displayName?.split(' ')[0]}</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Salir
        </button>
      </div>
    </header>
  );
};

export default Header;
