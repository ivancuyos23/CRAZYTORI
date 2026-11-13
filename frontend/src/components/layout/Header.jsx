import React from 'react';
import './Header.css';

export default function Header({ role, onRoleToggle }) {
  return (
    <header className="top-header">
      <div className="brand-logo-container">
        <div className="logo-text-group">
          <span className="logo-crazy">CRAZY</span>
          <span className="logo-tori">TORI</span>
        </div>
        <div className="logo-subtext">
          <span className="jp-sub">チキンポッパー</span>
          <span className="branch-sub">• CDU Branch POS</span>
        </div>
      </div>

      <div className="header-actions">
        <div className={`role-switcher-pill ${role === 'Admin' ? 'is-admin' : 'is-cashier'}`}>
          <div className="role-status">
            <span className="status-dot"></span>
            <span className="role-label">{role} Mode</span>
          </div>
          <button
            className="role-action-btn"
            onClick={onRoleToggle}
            title={role === 'Admin' ? 'Lock back to Cashier Mode' : 'Unlock Admin Mode'}
          >
            {role === 'Admin' ? 'Lock ↩' : 'Admin 🔒'}
          </button>
        </div>
      </div>
    </header>
  );
}