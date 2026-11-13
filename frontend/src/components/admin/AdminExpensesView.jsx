import React, { useState } from 'react';
import './AdminViews.css';
import './AdminExpensesView.css';

const EXPENSE_TIERS = [
  {
    value: 'Store-Level Daily (Ingredients, Packaging, Supplies)',
    shortLabel: 'Store-Level Daily',
    sub: 'Ingredients, packaging, kitchen supplies',
    presets: ['Chicken & Ingredients', 'Packaging & Cups', 'Cooking Oil', 'Ice & Drinks Stock', 'Cleaning Supplies']
  },
  {
    value: 'Fixed Monthly Overhead (Rent, Electricity, Water, Internet)',
    shortLabel: 'Fixed Monthly Overhead',
    sub: 'Rent, electricity, water, internet bills',
    presets: ['Monthly Store Rent', 'Electricity Bill', 'Water Bill', 'Internet Subscription']
  },
  {
    value: 'Major Operational (Commissary, Staff & Supervisor Salaries)',
    shortLabel: 'Major Operational',
    sub: 'Commissary deliveries & staff payroll',
    presets: ['Commissary Payment', 'Staff Salaries', 'Supervisor / Manager Salary', 'Equipment Maintenance']
  }
];

export default function AdminExpensesView({
  expenses = [],
  role = 'Admin',
  permissions = {},
  onSaveExpense,
  onDeleteExpense
}) {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Form States
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState(EXPENSE_TIERS[0].value);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Audit Table Filter States
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterTier, setFilterTier] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const activeTierObj = EXPENSE_TIERS.find(t => t.value === category) || EXPENSE_TIERS[0];
  const canDelete = role === 'Admin' || permissions.canDeleteExpenses;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    await onSaveExpense({
      id: 'EXP-' + Date.now(),
      date,
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      loggedBy: role
    });

    setDescription('');
    setAmount('');
  };

  // Monthly KPI Calculations (Based on selected filterMonth)
  const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(filterMonth));
  const totalDailyTier = monthExpenses
    .filter(e => e.category && e.category.startsWith('Store-Level Daily'))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalOverheadTier = monthExpenses
    .filter(e => e.category && e.category.startsWith('Fixed Monthly Overhead'))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalMajorTier = monthExpenses
    .filter(e => e.category && e.category.startsWith('Major Operational'))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalMonthOutflow = totalDailyTier + totalOverheadTier + totalMajorTier;

  // Filtered Table Rows
  const filteredExpenses = monthExpenses.filter(exp => {
    const matchesTier = filterTier === 'All' || (exp.category && exp.category.startsWith(filterTier));
    const matchesSearch =
      !searchQuery ||
      (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.category && exp.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTier && matchesSearch;
  });

  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="admin-page-container">
      {/* Top Header & Month Selector */}
      <div className="admin-header-bar">
        <div>
          <h2>Store Expense & Overhead Management</h2>
          <p className="admin-subtitle">
            Strictly categorized into Store-Level Daily, Fixed Overhead, and Major Operational costs
          </p>
        </div>
        <div className="expense-filter-bar">
          <span className="filter-label">Viewing Month:</span>
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="admin-date-input"
          />
        </div>
      </div>

      {/* 4-Card Monthly Expense KPI Summary */}
      <div className="expense-kpi-grid">
        <div className="admin-kpi-card">
          <span>Store-Level Daily</span>
          <h3>₱{totalDailyTier.toFixed(2)}</h3>
          <small className="kpi-sub">Ingredients & supplies</small>
        </div>
        <div className="admin-kpi-card">
          <span>Fixed Monthly Overhead</span>
          <h3>₱{totalOverheadTier.toFixed(2)}</h3>
          <small className="kpi-sub">Rent, power, water, internet</small>
        </div>
        <div className="admin-kpi-card">
          <span>Major Operational</span>
          <h3>₱{totalMajorTier.toFixed(2)}</h3>
          <small className="kpi-sub">Commissary & staff payroll</small>
        </div>
        <div className="admin-kpi-card kpi-highlight-outflow">
          <span>Total Outflow ({filterMonth})</span>
          <h3 className="text-danger">-₱{totalMonthOutflow.toFixed(2)}</h3>
          <small className="kpi-sub">{monthExpenses.length} recorded entries</small>
        </div>
      </div>

      <div className="admin-two-col">
        {/* LEFT COLUMN: Log New Expense Form */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">NEW VOUCHER ENTRY</span>
              <h3>Record Store Expense</h3>
            </div>
            <span className="ledger-badge">Logged by: {role}</span>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <label>1. Select Expense Category Tier</label>
            <div className="tier-selector-stack">
              {EXPENSE_TIERS.map(tier => {
                const isSelected = category === tier.value;
                return (
                  <button
                    type="button"
                    key={tier.shortLabel}
                    className={`tier-select-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setCategory(tier.value)}
                  >
                    <div className="tier-card-top">
                      <strong>{tier.shortLabel}</strong>
                      <span className="tier-radio">{isSelected ? '●' : '○'}</span>
                    </div>
                    <small>{tier.sub}</small>
                  </button>
                );
              })}
            </div>

            <label style={{ marginTop: '6px' }}>2. Particular / Description</label>
            <div className="preset-chips-row">
              {activeTierObj.presets.map(preset => (
                <button
                  type="button"
                  key={preset}
                  className={`preset-chip ${description === preset ? 'active' : ''}`}
                  onClick={() => setDescription(preset)}
                >
                  + {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Or type custom expense description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />

            <div className="form-split-row">
              <div>
                <label>3. Amount (₱)</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <label>4. Expense Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary-amber">
              + Save Expense Entry
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Expense Audit Log Table */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">EXPENSE LEDGER</span>
              <h3>Audit Log ({filteredExpenses.length} Entries)</h3>
            </div>

            <div className="audit-controls-row">
              <select
                value={filterTier}
                onChange={e => setFilterTier(e.target.value)}
                className="audit-filter-select"
              >
                <option value="All">All 3 Tiers</option>
                <option value="Store-Level Daily">Store-Level Daily</option>
                <option value="Fixed Monthly Overhead">Fixed Overhead</option>
                <option value="Major Operational">Major Operational</option>
              </select>

              <input
                type="text"
                placeholder="Search description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="audit-search-input"
              />
            </div>
          </div>

          <div className="audit-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category Tier</th>
                  <th>Particular / Description</th>
                  <th>By</th>
                  <th className="text-right">Amount</th>
                  {canDelete && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={canDelete ? 6 : 5} className="empty-row">
                      No expense entries match this filter for {filterMonth}.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{exp.date ? exp.date.split('T')[0] : '-'}</td>
                      <td>
                        <span className="method-badge">
                          {exp.category ? exp.category.split(' (')[0] : 'Expense'}
                        </span>
                      </td>
                      <td><strong>{exp.description}</strong></td>
                      <td><small className="muted-by">{exp.loggedBy || 'Admin'}</small></td>
                      <td className="text-right text-danger">
                        <strong>-₱{Number(exp.amount || 0).toFixed(2)}</strong>
                      </td>
                      {canDelete && (
                        <td className="text-right">
                          <button
                            className="btn-danger-sm"
                            onClick={() => onDeleteExpense(exp.id)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="ledger-total-box">
            <div>
              <span className="ledger-total-label">FILTERED EXPENSE TOTAL</span>
              <small>Showing {filteredExpenses.length} of {monthExpenses.length} entries in {filterMonth}</small>
            </div>
            <div className="ledger-total-figure text-danger">
              -₱{filteredTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}