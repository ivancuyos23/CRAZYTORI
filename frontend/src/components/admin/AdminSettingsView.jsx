import React, { useState } from 'react';
import { updateAdminPinAPI } from '../../services/api';
import {
  exportFullBackupReport,
  exportSalesReport,
  exportExpensesReport
} from '../../services/exportHelper';
import './AdminViews.css';
import './AdminSettingsView.css';

const PERMISSION_ITEMS = [
  { key: 'canVoidTransactions', title: 'Void Orders' },
  { key: 'canFilterTransactionDates', title: 'Filter Order Dates' },
  { key: 'canViewDSR', title: 'View DSR & P&L' },
  { key: 'canViewUsage', title: 'View Daily Usage' },
  { key: 'canLogExpenses', title: 'Add Expenses' },
  { key: 'canDeleteExpenses', title: 'Delete Expenses' },
  { key: 'canManageMenu', title: 'Edit Menu' }
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
  const [cashFloat, setCashFloat] = useState(() => localStorage.getItem('crazy_tori_cash_float') || '1000');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStatus, setPinStatus] = useState({ type: '', msg: '' });

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (type) => {
    const isLead = type === 'shiftLead';
    setPermissions({
      canVoidTransactions: isLead,
      canFilterTransactionDates: isLead,
      canViewDSR: isLead,
      canViewUsage: isLead,
      canLogExpenses: isLead,
      canDeleteExpenses: false,
      canManageMenu: false
    });
  };

  const handleSaveFloat = (e) => {
    e.preventDefault();
    localStorage.setItem('crazy_tori_cash_float', cashFloat);
    alert(`Cash float saved: ₱${Number(cashFloat || 0).toFixed(2)}`);
  };

  const handlePinUpdate = async (e) => {
    e.preventDefault();
    setPinStatus({ type: '', msg: '' });
    if (!/^\d{4}$/.test(newPin)) return setPinStatus({ type: 'error', msg: 'PIN must be 4 digits.' });
    if (newPin !== confirmPin) return setPinStatus({ type: 'error', msg: 'PINs do not match.' });

    try {
      await updateAdminPinAPI(currentPin, newPin);
      setPinStatus({ type: 'success', msg: 'PIN updated!' });
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setPinStatus({ type: 'error', msg: err.response?.data?.error || 'Incorrect current PIN.' });
    }
  };

  const enabledCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="admin-page-container">
      <div className="admin-header-bar">
        <h2>Settings</h2>
      </div>

      <div className="expense-kpi-grid">
        <div className="admin-kpi-card">
          <span>Cashier Access</span>
          <h3>{enabledCount} / {PERMISSION_ITEMS.length}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>Cash Float</span>
          <h3>₱{Number(cashFloat || 0).toFixed(2)}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>Serving #</span>
          <h3>#{servingNo}</h3>
        </div>
        <div className="admin-kpi-card kpi-highlight-outflow">
          <span>Saved Records</span>
          <h3>{transactions.length + expenses.length}</h3>
        </div>
      </div>

      <div className="admin-two-col">
        <div className="settings-stack">
          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <h3>Cashier Access</h3>
              <div className="preset-btn-group">
                <button type="button" className="btn-secondary-sm" onClick={() => applyPreset('strict')}>
                  Default
                </button>
                <button type="button" className="btn-secondary-sm" onClick={() => applyPreset('shiftLead')}>
                  All On
                </button>
              </div>
            </div>

            <div className="permissions-list">
              {PERMISSION_ITEMS.map(item => (
                <div key={item.key} className="permission-row">
                  <div className="permission-info">
                    <strong>{item.title}</strong>
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

          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <h3>Register Controls</h3>
            </div>
            <div className="shift-controls-grid">
              <form onSubmit={handleSaveFloat} className="shift-control-box">
                <strong>💵 Starting Cash Float (₱)</strong>
                <div className="inline-input-row">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cashFloat}
                    onChange={e => setCashFloat(e.target.value)}
                  />
                  <button type="submit" className="btn-secondary-sm">Save</button>
                </div>
              </form>

              <div className="shift-control-box">
                <strong>🍽️ Serving Number (#{servingNo})</strong>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => setServingNo && setServingNo(1)}
                >
                  ↺ Reset to #1
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-stack">
          {/* Branded PDF & Excel Backups */}
          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <h3>Backups & Exports</h3>
              <span className="ledger-badge">PDF & Excel</span>
            </div>

            <div className="backup-actions-list">
              <div className="backup-action-item">
                <div>
                  <strong>📦 Complete Store Backup</strong>
                  <small>Sales, Expenses & Net Summary</small>
                </div>
                <div className="export-choice-btns">
                  <button
                    type="button"
                    className="btn-primary-amber"
                    onClick={() => exportFullBackupReport({ transactions, expenses, products }, 'pdf')}
                  >
                    📄 PDF
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    onClick={() => exportFullBackupReport({ transactions, expenses, products }, 'excel')}
                  >
                    📊 Excel
                  </button>
                </div>
              </div>

              <div className="backup-action-item">
                <div>
                  <strong>🧾 Sales Report ({transactions.length})</strong>
                  <small>All recorded customer orders</small>
                </div>
                <div className="export-choice-btns">
                  <button
                    type="button"
                    className="btn-primary-amber"
                    onClick={() => exportSalesReport(transactions, 'pdf')}
                  >
                    📄 PDF
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    onClick={() => exportSalesReport(transactions, 'excel')}
                  >
                    📊 Excel
                  </button>
                </div>
              </div>

              <div className="backup-action-item">
                <div>
                  <strong>💸 Expenses Report ({expenses.length})</strong>
                  <small>All 3-tier expense entries</small>
                </div>
                <div className="export-choice-btns">
                  <button
                    type="button"
                    className="btn-primary-amber"
                    onClick={() => exportExpensesReport(expenses, 'pdf')}
                  >
                    📄 PDF
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    onClick={() => exportExpensesReport(expenses, 'excel')}
                  >
                    📊 Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <h3>Change Admin PIN</h3>
            </div>
            <form onSubmit={handlePinUpdate} className="admin-form">
              <label>Current PIN</label>
              <input
                type="password"
                maxLength="4"
                placeholder="••••"
                value={currentPin}
                onChange={e => setCurrentPin(e.target.value)}
                required
              />
              <div className="form-split-row">
                <div>
                  <label>New PIN</label>
                  <input
                    type="password"
                    maxLength="4"
                    placeholder="••••"
                    value={newPin}
                    onChange={e => setNewPin(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Confirm PIN</label>
                  <input
                    type="password"
                    maxLength="4"
                    placeholder="••••"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value)}
                    required
                  />
                </div>
              </div>
              {pinStatus.msg && <div className={`pin-alert ${pinStatus.type}`}>{pinStatus.msg}</div>}
              <button type="submit" className="btn-primary-amber" style={{ marginTop: '6px' }}>
                Update PIN
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}