import React, { useState, useRef } from 'react';
import { exportExpensesReport } from '../../services/exportHelper';
import { PaginationBar, showToast } from '../layout/UIFeedback';
import './AdminViews.css';
import './AdminExpensesView.css';

const EXPENSES_PER_PAGE = 8;

const EXPENSE_TIERS = [
  {
    value: 'Store-Level Daily',
    shortLabel: '📦 Daily Store',
    presets: ['Chicken & Meat', 'Takoyaki Mix', 'Packaging & Cups', 'Cooking Oil', 'Ice & Water', 'Kitchen Gas']
  },
  {
    value: 'Fixed Monthly Overhead',
    shortLabel: '🏢 Fixed Overhead',
    presets: ['Monthly Store Rent', 'Electricity Bill', 'Water Bill', 'Internet / Wi-Fi', 'Permits & Dues']
  },
  {
    value: 'Major Operational',
    shortLabel: '💼 Major Ops',
    presets: ['Commissary Invoice', 'Cashier Salary', 'Kitchen Staff Salary', 'Supervisor Salary', 'Equipment Repair']
  }
];

const formatMoney = (val) =>
  Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export default function AdminExpensesView({
  expenses = [],
  role = 'Admin',
  permissions = {},
  onSaveExpense,
  onDeleteExpense
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);

  const [editingId, setEditingId] = useState(null);
  const [category, setCategory] = useState('Store-Level Daily');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expDate, setExpDate] = useState(todayStr);

  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [filterDay, setFilterDay] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const formRef = useRef(null);
  const canDelete = role === 'Admin' || permissions.canDeleteExpenses;

  const activeTierObj =
    EXPENSE_TIERS.find(t => t.value === category) || EXPENSE_TIERS[0];

  const resetForm = () => {
    setEditingId(null);
    setCategory('Store-Level Daily');
    setDescription('');
    setAmount('');
    setExpDate(todayStr);
  };

  const handleStartEdit = (exp) => {
    setEditingId(exp.id);
    const matchedTier = EXPENSE_TIERS.find(t =>
      (exp.category || '').startsWith(t.value)
    );
    setCategory(matchedTier ? matchedTier.value : 'Store-Level Daily');
    setDescription(exp.description || '');
    setAmount(String(exp.amount ?? ''));
    setExpDate((exp.date || todayStr).split('T')[0]);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount || Number(amount) <= 0) {
      return showToast('Please enter a valid description and amount.', 'error');
    }

    if (editingId && onDeleteExpense) {
      await onDeleteExpense(editingId);
    }

    await onSaveExpense({
      id: editingId || 'EXP-' + Date.now(),
      date: new Date(expDate + 'T12:00:00').toISOString(),
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      loggedBy: role
    });

    resetForm();
  };

  const monthExpenses = expenses.filter(e =>
    (e.date || '').startsWith(filterMonth)
  );

  const totalDailyStore = monthExpenses
    .filter(e => (e.category || '').startsWith('Store-Level Daily'))
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalFixedOverhead = monthExpenses
    .filter(e => (e.category || '').startsWith('Fixed Monthly Overhead'))
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalMajorOps = monthExpenses
    .filter(e => (e.category || '').startsWith('Major Operational'))
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalMonthOutflow =
    totalDailyStore + totalFixedOverhead + totalMajorOps;

  const filteredExpenses = monthExpenses.filter(e => {
    const matchDay = !filterDay || (e.date || '').startsWith(filterDay);
    const matchTier =
      filterTier === 'ALL' || (e.category || '').startsWith(filterTier);
    const matchSearch =
      !searchQuery.trim() ||
      (e.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchDay && matchTier && matchSearch;
  });

  const filteredSum = filteredExpenses.reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  );

  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / EXPENSES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedExpenses = filteredExpenses.slice(
    (safePage - 1) * EXPENSES_PER_PAGE,
    safePage * EXPENSES_PER_PAGE
  );

  return (
    <div className="admin-page-container">
      <div className="admin-header-bar">
        <div>
          <h2>Store Expenses & Overhead</h2>
          <p className="admin-subtitle">
            3-Tier Operational Cost Tracking ({filterMonth})
          </p>
        </div>

        <div className="exp-header-actions">
          <input
            type="month"
            value={filterMonth}
            onChange={e => {
              setFilterMonth(e.target.value);
              setFilterDay('');
              setCurrentPage(1);
            }}
            className="exp-month-picker"
          />
          <button
            type="button"
            className="btn-primary-amber"
            onClick={() => exportExpensesReport(filteredExpenses, 'pdf')}
          >
            🖨️ Print PDF
          </button>
          <button
            type="button"
            className="btn-secondary-sm"
            onClick={() => exportExpensesReport(filteredExpenses, 'excel')}
          >
            📊 Excel
          </button>
        </div>
      </div>

      <div className="expense-kpi-grid">
        <div className="admin-kpi-card">
          <span>📦 Daily Store</span>
          <h3>₱{formatMoney(totalDailyStore)}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>🏢 Fixed Overhead</span>
          <h3>₱{formatMoney(totalFixedOverhead)}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>💼 Major Ops</span>
          <h3>₱{formatMoney(totalMajorOps)}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>Total Outflow</span>
          <h3 className="text-danger">-₱{formatMoney(totalMonthOutflow)}</h3>
        </div>
      </div>

      <div className="admin-two-col">
        <div className="admin-card report-sheet" ref={formRef}>
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">
                {editingId ? 'UPDATING RECORD' : '3-TIER EXPENSE ENTRY'}
              </span>
              <h3>{editingId ? 'Edit Expense' : 'Log Store Expense'}</h3>
            </div>
            {editingId && (
              <button
                type="button"
                className="btn-secondary-sm"
                onClick={resetForm}
              >
                ✕ Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="exp-form-stack">
            <div className="exp-field-group">
              <label className="exp-label">1. Select Expense Tier</label>
              <div className="exp-tier-selector">
                {EXPENSE_TIERS.map(tier => (
                  <button
                    key={tier.value}
                    type="button"
                    className={
                      category === tier.value
                        ? 'exp-tier-btn active'
                        : 'exp-tier-btn'
                    }
                    onClick={() => setCategory(tier.value)}
                  >
                    {tier.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="exp-presets-box">
              <span className="exp-preset-title">
                ⚡ Quick-Fill Presets ({activeTierObj.shortLabel}):
              </span>
              <div className="exp-preset-chips">
                {activeTierObj.presets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    className={
                      description === preset
                        ? 'exp-preset-chip active'
                        : 'exp-preset-chip'
                    }
                    onClick={() => setDescription(preset)}
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="exp-field-group">
              <label className="exp-label">2. Expense Description</label>
              <input
                type="text"
                placeholder="e.g. Chicken delivery, Electricity bill..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="exp-split-row">
              <div className="exp-field-group">
                <label className="exp-label">3. Amount (₱)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="exp-field-group">
                <label className="exp-label">4. Date</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="exp-submit-btn">
              {editingId ? '✓ Update Expense' : '+ Save Expense Record'}
            </button>
          </form>
        </div>

        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">AUDIT TRAIL</span>
              <h3>Expense List ({filteredExpenses.length})</h3>
            </div>
            <span className="ledger-badge">
              Total: -₱{formatMoney(filteredSum)}
            </span>
          </div>

          <div className="exp-filter-bar">
            <div className="exp-tier-pills">
              {[
                { key: 'ALL', label: `All (${monthExpenses.length})` },
                { key: 'Store-Level Daily', label: '📦 Daily' },
                { key: 'Fixed Monthly Overhead', label: '🏢 Fixed' },
                { key: 'Major Operational', label: '💼 Major' }
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className={
                    filterTier === tab.key ? 'tx-tab-pill active' : 'tx-tab-pill'
                  }
                  onClick={() => {
                    setFilterTier(tab.key);
                    setCurrentPage(1);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="exp-search-date-row">
              <input
                type="text"
                className="exp-search-input"
                placeholder="🔍 Search description..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <input
                type="date"
                className="exp-day-input"
                value={filterDay}
                onChange={e => {
                  setFilterDay(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {(filterDay || searchQuery || filterTier !== 'ALL') && (
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => {
                    setFilterDay('');
                    setSearchQuery('');
                    setFilterTier('ALL');
                    setCurrentPage(1);
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="exp-ledger-list">
            {pagedExpenses.length === 0 ? (
              <div className="pending-empty-box">
                No expenses recorded for this filter.
              </div>
            ) : (
              pagedExpenses.map(exp => {
                const dateShort = new Date(exp.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
                const isDaily = (exp.category || '').startsWith('Store-Level');
                const isFixed = (exp.category || '').startsWith('Fixed');
                const shortCat = isDaily
                  ? 'Daily Store'
                  : isFixed
                  ? 'Fixed Overhead'
                  : 'Major Ops';

                return (
                  <div
                    key={exp.id}
                    className={`exp-ledger-row ${
                      editingId === exp.id ? 'is-editing' : ''
                    }`}
                  >
                    <div className="exp-row-left">
                      <span className="exp-date-pill">{dateShort}</span>
                      <div className="exp-row-info">
                        <strong>{exp.description}</strong>
                        <span className="exp-cat-sub">{shortCat}</span>
                      </div>
                    </div>

                    <div className="exp-row-right">
                      <strong className="exp-row-amount">
                        -₱{formatMoney(exp.amount)}
                      </strong>
                      <div className="exp-row-actions">
                        <button
                          type="button"
                          className="btn-secondary-sm"
                          onClick={() => handleStartEdit(exp)}
                          title="Edit Expense"
                        >
                          ✏️
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            className="btn-danger-sm"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Delete expense "${exp.description}"?`
                                )
                              ) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            title="Delete Expense"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <PaginationBar
            currentPage={safePage}
            totalItems={filteredExpenses.length}
            pageSize={EXPENSES_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}