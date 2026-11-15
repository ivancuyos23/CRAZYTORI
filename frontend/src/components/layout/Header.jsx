import React from 'react';
import './Header.css';

export default function Header({
  role = 'Cashier',
  onRoleClick,
  onSwitchRole,
  onToggleRole
}) {
  // Supports any of the handler prop names from App.jsx
  const handleTrigger = onRoleClick || onSwitchRole || onToggleRole;
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
          <span className="branch-sub">CDU Branch</span>
        </div>
      </div>

      <div className="header-actions">
        <div
          className={`role-switcher-pill ${isAdmin ? 'is-admin' : ''}`}
          onClick={handleTrigger}
          style={{ cursor: 'pointer' }}
        >
          <div className="role-status">
            <span className="status-dot"></span>
            <span className="role-label">{isAdmin ? 'Admin' : 'Cashier'}</span>
          </div>

          <button
            type="button"
            className="role-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (handleTrigger) handleTrigger();
            }}
          >
            {isAdmin ? 'Exit Admin' : 'Admin Login'}
          </button>
        </div>
      </div>
    </header>
  );
}