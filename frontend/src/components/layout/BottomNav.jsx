import React from 'react';

export default function BottomNav({
  activeTab,
  setActiveTab,
  role,
  permissions = {},
  waitingCount = 0
}) {
  const isAdmin = role === 'Admin';

  return (
    <nav className="bottom-nav">
      <button
        className={activeTab === 'pos' ? 'nav-item active' : 'nav-item'}
        onClick={() => setActiveTab('pos')}
      >
        <span>🍱</span> POS Register
      </button>

      <button
        className={activeTab === 'transactions' ? 'nav-item active' : 'nav-item'}
        onClick={() => setActiveTab('transactions')}
      >
        <span>📋</span> {isAdmin ? 'Orders & Audit' : 'Shift Orders'}
        {waitingCount > 0 ? ` (${waitingCount})` : ''}
      </button>

      <button
        className={activeTab === 'inventory' ? 'nav-item active' : 'nav-item'}
        onClick={() => setActiveTab('inventory')}
      >
        <span>📦</span> Inventory
      </button>

      {(isAdmin || permissions.canViewDSR) && (
        <button
          className={activeTab === 'dsr' ? 'nav-item active' : 'nav-item'}
          onClick={() => setActiveTab('dsr')}
        >
          <span>📊</span> DSR & P&L
        </button>
      )}

      {(isAdmin || permissions.canLogExpenses) && (
        <button
          className={activeTab === 'expenses' ? 'nav-item active' : 'nav-item'}
          onClick={() => setActiveTab('expenses')}
        >
          <span>💸</span> Expenses
        </button>
      )}

      {(isAdmin || permissions.canManageMenu) && (
        <button
          className={activeTab === 'menu' ? 'nav-item active' : 'nav-item'}
          onClick={() => setActiveTab('menu')}
        >
          <span>🍔</span> Menu Manager
        </button>
      )}

      {isAdmin && (
        <button
          className={activeTab === 'settings' ? 'nav-item active' : 'nav-item'}
          onClick={() => setActiveTab('settings')}
        >
          <span>⚙️</span> Settings
        </button>
      )}
    </nav>
  );
}