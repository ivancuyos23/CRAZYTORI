import React, { useState } from 'react';
import { updateAdminPinAPI } from '../../services/api';
import {
  exportFullBackupReport,
  exportSalesReport,
  exportExpensesReport
} from '../../services/exportHelper';
import { showToast } from '../layout/UIFeedback';
import { DEFAULT_INV_SETTINGS, loadInvSettings } from './InventoryControls';
import './AdminViews.css';
import './AdminSettingsView.css';

const PERMISSION_ITEMS = [
  { key: 'canVoidTransactions', title: 'Void Orders' },
  { key: 'canFilterTransactionDates', title: 'Filter Order Dates' },
  { key: 'canViewDSR', title: 'View DSR & P&L' },
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
  const [cashFloat, setCashFloat] = useState(
    () => localStorage.getItem('crazy_tori_cash_float') || '1000'
  );

  // Inventory REQ Alert Threshold Settings
  const [invSettings, setInvSettings] = useState(() => loadInvSettings());

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
      canLogExpenses: isLead,
      canDeleteExpenses: false,
      canManageMenu: false
    });
  };

  const handleSaveFloat = (e) => {
    e.preventDefault();
    localStorage.setItem('crazy_tori_cash_float', cashFloat);
    showToast(`Cash float saved: ₱${Number(cashFloat || 0).toFixed(2)}`, 'success');
  };

  const handleSaveInvSettings = (e) => {
    e.preventDefault();
    const cleaned = {
      ruleMode: invSettings.ruleMode || 'both',
      pieceReqLimit: Math.max(0, Number(invSettings.pieceReqLimit) || 0),
      weightGramsReqLimit: Math.max(0, Number(invSettings.weightGramsReqLimit) || 0),
      weightKgReqLimit: Math.max(0, Number(invSettings.weightKgReqLimit) || 0),
      percentReqLimit: Math.min(100, Math.max(1, Number(invSettings.percentReqLimit) || 50))
    };
    setInvSettings(cleaned);
    localStorage.setItem('crazy_tori_inv_settings', JSON.stringify(cleaned));
    showToast('Inventory REQ alert thresholds saved!', 'success');
  };

  const handlePinUpdate = async (e) => {
    e.preventDefault();
    setPinStatus({ type: '', msg: '' });
    if (!/^\d{4}$/.test(newPin)) {
      return setPinStatus({ type: 'error', msg: 'PIN must be 4 digits.' });
    }
    if (newPin !== confirmPin) {
      return setPinStatus({ type: 'error', msg: 'PINs do not match.' });
    }

    try {
      await updateAdminPinAPI(currentPin, newPin);
      setPinStatus({ type: 'success', msg: 'PIN updated!' });
      showToast('Admin PIN updated!', 'success');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setPinStatus({
        type: 'error',
        msg: err.response?.data?.error || 'Incorrect current PIN.'
      });
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header-bar">
        <div>
          <h2>Settings</h2>
          <p className="admin-subtitle">
            Manage cashier permissions, register controls, inventory REQ thresholds, and backups
          </p>
        </div>
      </div>

      <div className="admin-two-col">
        <div className="settings-stack">
          {/* Card 1: Cashier Access */}
          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <h3>Cashier Access</h3>
              <div className="preset-btn-group">
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => applyPreset('strict')}
                >
                  Default
                </button>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => applyPreset('shiftLead')}
                >
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

          {/* Card 2: Inventory REQ Alert Rules (Pieces, Weight & Percentage) */}
          <div className="admin-card report-sheet">
            <div className="report-sheet-header">
              <div>
                <span className="report-tag">STOCK ALERT RULES</span>
                <h3>📦 Inventory REQ Thresholds</h3>
              </div>
            </div>

            <form onSubmit={handleSaveInvSettings} className="admin-form">
              <div>
                <label>When Should REQ Appear?</label>
                <select
                  value={invSettings.ruleMode}
                  onChange={e =>
                    setInvSettings({ ...invSettings, ruleMode: e.target.value })
                  }
                >
                  <option value="both">
                    Piece/Weight Limit OR Below {invSettings.percentReqLimit}% (Recommended)
                  </option>
                  <option value="threshold">
                    Only By Piece / Weight Limit
                  </option>
                  <option value="percent">
                    Only By Percentage (&lt; {invSettings.percentReqLimit}% of Start)
                  </option>
                </select>
              </div>

              <div className="form-split-row">
                <div>
                  <label>🔢 By Piece REQ Limit (pcs)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={invSettings.pieceReqLimit}
                    onChange={e =>
                      setInvSettings({ ...invSettings, pieceReqLimit: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>📉 Low Stock % Rule (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={invSettings.percentReqLimit}
                    onChange={e =>
                      setInvSettings({ ...invSettings, percentReqLimit: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-split-row">
                <div>
                  <label>⚖️ Weight Limit in Grams (g)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={invSettings.weightGramsReqLimit}
                    onChange={e =>
                      setInvSettings({
                        ...invSettings,
                        weightGramsReqLimit: e.target.value
                      })
                    }
                  />
                </div>

                <div>
                  <label>⚖️ Weight Limit in Kilos (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={invSettings.weightKgReqLimit}
                    onChange={e =>
                      setInvSettings({
                        ...invSettings,
                        weightKgReqLimit: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => {
                    setInvSettings(DEFAULT_INV_SETTINGS);
                    localStorage.setItem(
                      'crazy_tori_inv_settings',
                      JSON.stringify(DEFAULT_INV_SETTINGS)
                    );
                    showToast('Reset REQ rules to defaults!', 'info');
                  }}
                >
                  Reset
                </button>
                <button type="submit" className="btn-primary-amber" style={{ flex: 1 }}>
                  ✓ Save REQ Thresholds
                </button>
              </div>
            </form>
          </div>

          {/* Card 3: Register Controls */}
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
                  <button type="submit" className="btn-secondary-sm">
                    Save
                  </button>
                </div>
              </form>

              <div className="shift-control-box">
                <strong>🍽️ Serving Number (#{servingNo})</strong>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => {
                    if (setServingNo) setServingNo(1);
                    showToast('Serving number reset to #1', 'info');
                  }}
                >
                  ↺ Reset to #1
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-stack">
          {/* Card 4: Backups & Exports */}
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
                    onClick={() =>
                      exportFullBackupReport({ transactions, expenses, products }, 'pdf')
                    }
                  >
                    📄 PDF
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    onClick={() =>
                      exportFullBackupReport({ transactions, expenses, products }, 'excel')
                    }
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

          {/* Card 5: Change Admin PIN */}
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
              {pinStatus.msg && (
                <div className={`pin-alert ${pinStatus.type}`}>{pinStatus.msg}</div>
              )}
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