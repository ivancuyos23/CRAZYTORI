import React, { useState } from 'react';
import { updateAdminPinAPI } from '../../services/api';
import './AdminViews.css';
import './AdminSettingsView.css';

const PERMISSION_ITEMS = [
  {
    key: 'canVoidTransactions',
    title: 'Void / Delete Transactions',
    desc: 'Allow Cashiers to void and remove erroneous order slips in Shift Orders.'
  },
  {
    key: 'canFilterTransactionDates',
    title: 'Inspect Past Transaction Dates',
    desc: 'Allow Cashiers to use the date picker to view orders from previous days.'
  },
  {
    key: 'canLogExpenses',
    title: 'Access & Log Store Expenses',
    desc: 'Unlock the Expenses tab in Cashier Mode to record daily supplies or petty cash outflows.'
  },
  {
    key: 'canDeleteExpenses',
    title: 'Delete Logged Expenses',
    desc: 'Allow Cashiers to delete expense entries from the Expense Audit Log.'
  },
  {
    key: 'canViewDSR',
    title: 'View Daily Sales Report (DSR) & P&L',
    desc: 'Unlock the Financial Reports (DSR & Monthly P&L) tab in Cashier Mode.'
  },
  {
    key: 'canManageMenu',
    title: 'Manage Menu Catalog & Prices',
    desc: 'Unlock the Menu Manager tab in Cashier Mode to add, edit, or remove products.'
  },
  { 
    key: 'canViewUsage',
    title: 'View Daily Ingredient Usage', 
    desc: 'Allow Cashiers to view daily kg/g consumption of Chicken, Rice, Fries & Batter Mix.' 
  }
];

export default function AdminSettingsView({
  permissions = {},
  setPermissions,
  servingNo = 1,
  setServingNo,
  transactions = [],
  expenses = [],
  products = []
}) {
  // Cash Drawer Opening Float (saved in localStorage)
  const [cashFloat, setCashFloat] = useState(() => {
    return localStorage.getItem('crazy_tori_cash_float') || '1000';
  });

  // Admin PIN Change States
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStatus, setPinStatus] = useState({ type: '', msg: '' });

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (type) => {
    if (type === 'strict') {
      setPermissions({
        canVoidTransactions: false,
        canFilterTransactionDates: false,
        canViewDSR: false,
        canLogExpenses: false,
        canDeleteExpenses: false,
        canManageMenu: false
      });
    } else if (type === 'shiftLead') {
      setPermissions({
        canVoidTransactions: true,
        canFilterTransactionDates: true,
        canViewDSR: true,
        canLogExpenses: true,
        canDeleteExpenses: false,
        canManageMenu: false
      });
    }
  };

  const handleSaveFloat = (e) => {
    e.preventDefault();
    localStorage.setItem('crazy_tori_cash_float', cashFloat);
    alert(`Opening Cash Drawer Float saved as ₱${Number(cashFloat || 0).toFixed(2)}`);
  };

  // --- EXPORT UTILITIES (JSON & EXCEL CSV) ---
  const todayStr = new Date().toISOString().split('T')[0];

  const handleExportJSONBackup = () => {
    const backupPayload = {
      store: 'Crazy Tori - CDU Branch',
      exportedAt: new Date().toISOString(),
      counts: {
        transactions: transactions.length,
        expenses: expenses.length,
        products: products.length
      },
      data: { transactions, expenses, products }
    };
    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crazy-tori-backup-${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSalesCSV = () => {
    const headers = ['Order ID', 'Date', 'Serving No', 'Payment Method', 'GCash Ref', 'Cashier', 'Items', 'Total (PHP)'];
    const rows = transactions.map(t => {
      const itemSummary = (t.items || [])
        .map(i => `${i.qty || 1}x ${i.name}${i.size ? ` (${i.size})` : ''}`)
        .join('; ');
      return [
        t.id,
        t.date,
        t.servingNo || '',
        t.paymentMethod,
        t.referenceNo || '',
        t.cashierName || 'Cashier',
        `"${itemSummary.replace(/"/g, '""')}"`,
        Number(t.total || 0).toFixed(2)
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crazy-tori-sales-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExpensesCSV = () => {
    const headers = ['Expense ID', 'Date', 'Category Tier', 'Description', 'Logged By', 'Amount (PHP)'];
    const rows = expenses.map(e => [
      e.id,
      e.date,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      e.loggedBy || 'Admin',
      Number(e.amount || 0).toFixed(2)
    ].join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crazy-tori-expenses-${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- ADMIN PIN UPDATE ---
  const handlePinUpdate = async (e) => {
    e.preventDefault();
    setPinStatus({ type: '', msg: '' });

    if (!/^\d{4}$/.test(newPin)) {
      return setPinStatus({ type: 'error', msg: 'New PIN must be exactly 4 digits.' });
    }
    if (newPin !== confirmPin) {
      return setPinStatus({ type: 'error', msg: 'New PIN and confirmation do not match.' });
    }

    try {
      await updateAdminPinAPI(currentPin, newPin);
      setPinStatus({ type: 'success', msg: 'Admin PIN updated successfully!' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setPinStatus({
        type: 'error',
        msg: err.response?.data?.error || 'Failed to update PIN. Check your current PIN.'
      });
    }
  };

  const enabledCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="admin-page-container">
      {/* Top Page Header */}
      <div className="admin-header-bar">
        <div>
          <h2>System Settings, Security & Data Backups</h2>
          <p className="admin-subtitle">
            Configure Cashier permissions, shift register controls, Admin PIN, and offline data exports
          </p>
        </div>
      </div>

      {/* 4-Card System Overview KPI Bar */}
      <div className="expense-kpi-grid">
        <div className="admin-kpi-card">
          <span>Cashier Permissions</span>
          <h3>{enabledCount} / 6 Enabled</h3>
          <small className="kpi-sub">
            {enabledCount === 0 ? 'Strict Cashier Mode' : 'Custom access active'}
          </small>
        </div>

        <div className="admin-kpi-card">
          <span>Opening Cash Float</span>
          <h3>₱{Number(cashFloat || 0).toFixed(2)}</h3>
          <small className="kpi-sub">Starting petty cash in drawer</small>
        </div>

        <div className="admin-kpi-card">
          <span>Next Serving Number</span>
          <h3>Serving #{servingNo}</h3>
          <small className="kpi-sub">Auto-cycles #1 to #16</small>
        </div>

        <div className="admin-kpi-card kpi-highlight-outflow">
          <span>Database Records</span>
          <h3>{transactions.length + expenses.length + products.length} Total</h3>
          <small className="kpi-sub">
            {transactions.length} Orders • {expenses.length} Exps • {products.length} Menu
          </small>
        </div>
      </div>

      <div className="admin-two-col">
        {/* ================= LEFT COLUMN: PERMISSIONS & SHIFT CONTROLS ================= */}
        <div className="settings-stack">
          {/* Card 1: Cashier Role Permissions */}
          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <div>
                <span className="report-tag">ACCESS CONTROL</span>
                <h3>Cashier Role Permissions</h3>
              </div>
              <div className="preset-btn-group">
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => applyPreset('strict')}
                >
                  Strict Default
                </button>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => applyPreset('shiftLead')}
                >
                  Shift Lead Preset
                </button>
              </div>
            </div>

            <div className="permissions-list">
              {PERMISSION_ITEMS.map(item => (
                <div key={item.key} className="permission-row">
                  <div className="permission-info">
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>

                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={!!permissions[item.key]}
                      onChange={() => togglePermission(item.key)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Register & Shift Controls */}
          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <div>
                <span className="report-tag">REGISTER OPERATIONS</span>
                <h3>Shift & Counter Controls</h3>
              </div>
            </div>

            <div className="shift-controls-grid">
              <form onSubmit={handleSaveFloat} className="shift-control-box">
                <strong>💵 Starting Cash Drawer Float (₱)</strong>
                <p>Record the opening petty cash / change fund placed in the register drawer.</p>
                <div className="inline-input-row">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cashFloat}
                    onChange={e => setCashFloat(e.target.value)}
                  />
                  <button type="submit" className="btn-secondary-sm">
                    Save Float
                  </button>
                </div>
              </form>

              <div className="shift-control-box">
                <strong>🍽️ Serving Number Counter (Currently #{servingNo})</strong>
                <p>Reset the customer serving number back to #1 at the start of a new shift.</p>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => setServingNo && setServingNo(1)}
                >
                  ↺ Reset Serving Number to #1
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: BACKUPS & ADMIN PIN SECURITY ================= */}
        <div className="settings-stack">
          {/* Card 3: Offline Database Backup & CSV Export */}
          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <div>
                <span className="report-tag">OFFLINE DATA SYNC & ARCHIVE</span>
                <h3>Database Backups & Excel Exports</h3>
              </div>
              <span className="ledger-badge">Local SQLite</span>
            </div>

            <p className="settings-helper-text">
              Download copies of your store database onto a USB flash drive or open your sales and expense logs directly in Microsoft Excel / Google Sheets.
            </p>

            <div className="backup-actions-list">
              <div className="backup-action-item">
                <div>
                  <strong>📦 Full POS Database Backup (.JSON)</strong>
                  <small>Saves all {transactions.length} orders, {expenses.length} expenses & {products.length} menu items</small>
                </div>
                <button
                  type="button"
                  className="btn-primary-amber"
                  onClick={handleExportJSONBackup}
                >
                  ⬇ Backup JSON
                </button>
              </div>

              <div className="backup-action-item">
                <div>
                  <strong>📊 Export Sales Transactions (.CSV for Excel)</strong>
                  <small>Spreadsheet of all order slips, payment methods, items & totals</small>
                </div>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={handleExportSalesCSV}
                >
                  ⬇ Sales CSV
                </button>
              </div>

              <div className="backup-action-item">
                <div>
                  <strong>💸 Export Expense Audit Log (.CSV for Excel)</strong>
                  <small>Spreadsheet of all 3-tier daily, overhead & operational expenses</small>
                </div>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={handleExportExpensesCSV}
                >
                  ⬇ Expenses CSV
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Admin PIN Security */}
          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <div>
                <span className="report-tag">SECURITY & AUTHENTICATION</span>
                <h3>Change 4-Digit Admin PIN</h3>
              </div>
              <span className="ledger-badge">🔒 Admin Only</span>
            </div>

            <form onSubmit={handlePinUpdate} className="admin-form">
              <label>Current 4-Digit Admin PIN</label>
              <input
                type="password"
                maxLength="4"
                placeholder="Enter current PIN (e.g. 1234)"
                value={currentPin}
                onChange={e => setCurrentPin(e.target.value)}
                required
              />

              <div className="form-split-row">
                <div>
                  <label>New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength="4"
                    placeholder="New 4 digits"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Confirm New PIN</label>
                  <input
                    type="password"
                    maxLength="4"
                    placeholder="Repeat new PIN"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value)}
                    required
                  />
                </div>
              </div>

              {pinStatus.msg && (
                <div className={`pin-alert ${pinStatus.type}`}>
                  {pinStatus.msg}
                </div>
              )}

              <button type="submit" className="btn-primary-amber" style={{ marginTop: '6px' }}>
                Update Admin PIN
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}