import React from 'react';
import './Header.css';

export default function Header({
  role = 'Cashier',
  onRoleToggle,
  onRoleClick,
  onSwitchRole,
  onToggleRole
}) {
  // Automatically works with any prop name passed from App.jsx
  const handleTrigger =
    onRoleToggle || onRoleClick || onSwitchRole || onToggleRole;
  const isAdmin = role === 'Admin';

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
        <div
          className={`role-switcher-pill ${isAdmin ? 'is-admin' : 'is-cashier'}`}
          onClick={() => {
            if (typeof handleTrigger === 'function') handleTrigger();
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="role-status">
            <span className="status-dot"></span>
            <span className="role-label">{role} Mode</span>
          </div>

          <button
            type="button"
            className="role-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof handleTrigger === 'function') handleTrigger();
            }}
            title={isAdmin ? 'Return to Cashier Mode' : 'Unlock Admin Mode'}
          >
            {isAdmin ? 'Lock ↩' : 'Admin 🔒'}
          </button>
        </div>
      </div>
    </header>
  );
}