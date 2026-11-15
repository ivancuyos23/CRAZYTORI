import React, { useState, useRef } from 'react';
import { exportExpensesReport } from '../../services/exportHelper';
import './AdminViews.css';
import './AdminExpensesView.css';

const EXPENSE_TIERS = [
  {
    value: 'Store-Level Daily (Ingredients, Packaging, Supplies)',
    shortKey: 'Store-Level Daily',
    shortLabel: 'Daily Store',
    tierClass: 'tier-daily',
    presets: ['Chicken & Ingredients', 'Packaging & Cups', 'Cooking Oil', 'Ice & Drinks', 'Supplies']
  },
  {
    value: 'Fixed Monthly Overhead (Rent, Electricity, Water, Internet)',
    shortKey: 'Fixed Monthly Overhead',
    shortLabel: 'Fixed Overhead',
    tierClass: 'tier-overhead',
    presets: ['Store Rent', 'Electricity', 'Water', 'Internet']
  },
  {
    value: 'Major Operational (Commissary, Staff & Supervisor Salaries)',
    shortKey: 'Major Operational',
    shortLabel: 'Major Ops',
    tierClass: 'tier-major',
    presets: ['Commissary', 'Staff Salary', 'Supervisor Salary', 'Maintenance']
  }
];

const PAPER_SIZES = [
  { value: 'A4', label: 'A4 Paper' },
  { value: 'Letter', label: 'Short Bond (Letter)' },
  { value: 'Legal', label: 'Long Bond (Legal)' },
  { value: '80mm', label: '80mm Thermal Receipt' }
];

const formatPeso = (num) =>
  Number(num || 0).toLocaleString('en-US', {
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
  const formCardRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [date, setDate] = useState(today);
  const [category, setCategory] = useState(EXPENSE_TIERS[0].value);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Filter State
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterDay, setFilterDay] = useState('');
  const [filterTier, setFilterTier] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [paperSize, setPaperSize] = useState('A4');

  const activeTierObj = EXPENSE_TIERS.find(t => t.value === category) || EXPENSE_TIERS[0];
  const canDelete = role === 'Admin' || permissions.canDeleteExpenses;

  const getTierInfo = (catString = '') => {
    return (
      EXPENSE_TIERS.find(t => catString.startsWith(t.shortKey)) || {
        shortLabel: 'Expense',
        tierClass: 'tier-daily'
      }
    );
  };

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setDate(exp.date ? exp.date.split('T')[0] : today);
    setCategory(exp.category || EXPENSE_TIERS[0].value);
    setDescription(exp.description || '');
    setAmount(String(exp.amount || ''));
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetForm = () => {
    setEditingId(null);
    setDate(today);
    setCategory(EXPENSE_TIERS[0].value);
    setDescription('');
    setAmount('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;

    if (editingId && onDeleteExpense) {
      await onDeleteExpense(editingId);
    }

    await onSaveExpense({
      id: editingId || 'EXP-' + Date.now(),
      date,
      category,
      description: description.trim(),
      amount: parseFloat(amount),
      loggedBy: role
    });

    resetForm();
  };

  // Monthly & Filtered Calculations
  const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(filterMonth));

  const dailyList = monthExpenses.filter(e => e.category && e.category.startsWith('Store-Level Daily'));
  const overheadList = monthExpenses.filter(e => e.category && e.category.startsWith('Fixed Monthly Overhead'));
  const majorList = monthExpenses.filter(e => e.category && e.category.startsWith('Major Operational'));

  const totalDailyTier = dailyList.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalOverheadTier = overheadList.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalMajorTier = majorList.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalMonthOutflow = totalDailyTier + totalOverheadTier + totalMajorTier;

  const filteredExpenses = monthExpenses.filter(exp => {
    const matchesTier = filterTier === 'All' || (exp.category && exp.category.startsWith(filterTier));
    const matchesDay = !filterDay || (exp.date && exp.date.startsWith(filterDay));
    const matchesSearch =
      !searchQuery ||
      (exp.description && exp.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (exp.category && exp.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTier && matchesDay && matchesSearch;
  });

  const filteredTotal = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const handleConfirmPrint = () => {
    exportExpensesReport(filteredExpenses, exportFormat, paperSize);
    setShowPrintModal(false);
  };

  return (
    <div className="admin-page-container">
      {/* Top Header */}
      <div className="admin-header-bar">
        <h2>Expenses</h2>
        <div className="expense-header-actions">
          <input
            type="month"
            value={filterMonth}
            onChange={e => {
              setFilterMonth(e.target.value);
              setFilterDay('');
            }}
            className="admin-date-input"
          />
          <button
            type="button"
            className="btn-primary-amber"
            onClick={() => setShowPrintModal(true)}
          >
            Print
          </button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="expense-kpi-grid">
        <div className="admin-kpi-card">
          <span>Daily Store</span>
          <h3>₱{formatPeso(totalDailyTier)}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>Fixed Overhead</span>
          <h3>₱{formatPeso(totalOverheadTier)}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>Major Ops</span>
          <h3>₱{formatPeso(totalMajorTier)}</h3>
        </div>
        <div className="admin-kpi-card kpi-highlight-outflow">
          <span>Total ({filterMonth})</span>
          <h3 className="text-danger">-₱{formatPeso(totalMonthOutflow)}</h3>
        </div>
      </div>

      <div className="admin-two-col">
        {/* LEFT COLUMN: ADD / EDIT EXPENSE FORM */}
        <div ref={formCardRef} className="admin-card report-sheet">
          <div className="report-sheet-header">
            <h3>{editingId ? `Edit: ${description}` : 'Add Expense'}</h3>
            {editingId && (
              <button type="button" className="btn-secondary-sm" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <label>Category</label>
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
                      <span className="tier-radio">{isSelected ? 'Selected' : ''}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <label>Item / Description</label>
            <div className="preset-chips-row">
              {activeTierObj.presets.map(preset => (
                <button
                  type="button"
                  key={preset}
                  className={`preset-chip ${description === preset ? 'active' : ''}`}
                  onClick={() => setDescription(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Enter expense description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />

            <div className="form-split-row">
              <div>
                <label>Amount (₱)</label>
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
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-btn-row" style={{ marginTop: '6px' }}>
              <button type="submit" className="btn-primary-amber" style={{ flex: 1 }}>
                {editingId ? 'Save Changes' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: COMPACT SINGLE-ROW EXPENSE LEDGER */}
        <div className="admin-card report-sheet">
          <div className="expense-nav-top">
            <div className="expense-filter-pills">
              <button
                type="button"
                className={`exp-tab-pill ${filterTier === 'All' ? 'active' : ''}`}
                onClick={() => setFilterTier('All')}
              >
                All <span>{monthExpenses.length}</span>
              </button>
              <button
                type="button"
                className={`exp-tab-pill ${filterTier === 'Store-Level Daily' ? 'active' : ''}`}
                onClick={() => setFilterTier('Store-Level Daily')}
              >
                Daily <span>{dailyList.length}</span>
              </button>
              <button
                type="button"
                className={`exp-tab-pill ${filterTier === 'Fixed Monthly Overhead' ? 'active' : ''}`}
                onClick={() => setFilterTier('Fixed Monthly Overhead')}
              >
                Overhead <span>{overheadList.length}</span>
              </button>
              <button
                type="button"
                className={`exp-tab-pill ${filterTier === 'Major Operational' ? 'active' : ''}`}
                onClick={() => setFilterTier('Major Operational')}
              >
                Major <span>{majorList.length}</span>
              </button>
            </div>

            <div className="expense-search-row">
              <div className="expense-search-box">
                <input
                  type="text"
                  placeholder="Search expense..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="day-filter-wrap">
                <input
                  type="date"
                  value={filterDay}
                  onChange={e => setFilterDay(e.target.value)}
                  className="admin-date-input"
                  title="Filter by date"
                />
                {filterDay && (
                  <button
                    type="button"
                    className="btn-secondary-sm"
                    onClick={() => setFilterDay('')}
                  >
                    All
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Clean Ledger List */}
          <div className="expense-ledger-list">
            {filteredExpenses.length === 0 ? (
              <div className="ledger-empty">No matching expenses found.</div>
            ) : (
              filteredExpenses.map(exp => {
                const tierInfo = getTierInfo(exp.category);
                const isEditing = editingId === exp.id;
                const rawDate = exp.date ? exp.date.split('T')[0] : '';
                const formattedDate = rawDate
                  ? new Date(rawDate + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })
                  : '—';

                return (
                  <div
                    key={exp.id}
                    className={`exp-ledger-row ${tierInfo.tierClass} ${isEditing ? 'active-edit' : ''}`}
                  >
                    {/* Left: Strictly Left-Aligned Title + Sub-meta */}
                    <div className="exp-row-main" onClick={() => startEdit(exp)}>
                      <span className="exp-row-title">{exp.description}</span>
                      <div className="exp-row-sub">
                        <span className="exp-row-date">{formattedDate}</span>
                        <span className="exp-row-dot">•</span>
                        <span className="exp-row-cat">{tierInfo.shortLabel}</span>
                      </div>
                    </div>

                    {/* Right: Formatted Amount + Compact Action Buttons */}
                    <div className="exp-row-right">
                      <span className="exp-row-amount">
                        -₱{formatPeso(exp.amount)}
                      </span>

                      <div className="exp-row-actions">
                        <button
                          type="button"
                          className="exp-btn-edit"
                          onClick={() => startEdit(exp)}
                        >
                          Edit
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            className="exp-btn-del"
                            onClick={() =>
                              window.confirm(`Delete "${exp.description}"?`) &&
                              onDeleteExpense(exp.id)
                            }
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Total Bar */}
          <div className="ledger-total-box">
            <span className="ledger-total-label">
              TOTAL ({filteredExpenses.length} ITEMS)
            </span>
            <div className="ledger-total-figure text-danger">
              -₱{formatPeso(filteredTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Print / Export Modal */}
      {showPrintModal && (
        <div className="modal-backdrop" onClick={() => setShowPrintModal(false)}>
          <div className="modal-card print-options-modal" onClick={e => e.stopPropagation()}>
            <div className="print-modal-header">
              <h3>Print Expenses ({filteredExpenses.length})</h3>
              <button
                type="button"
                className="close-x-btn"
                onClick={() => setShowPrintModal(false)}
              >
                ×
              </button>
            </div>

            <div className="print-option-group">
              <label>1. Choose Format</label>
              <div className="format-choice-grid">
                <button
                  type="button"
                  className={`format-choice-btn ${exportFormat === 'pdf' ? 'active' : ''}`}
                  onClick={() => setExportFormat('pdf')}
                >
                  <strong>PDF / Print</strong>
                </button>
                <button
                  type="button"
                  className={`format-choice-btn ${exportFormat === 'excel' ? 'active' : ''}`}
                  onClick={() => setExportFormat('excel')}
                >
                  <strong>Excel (.xls)</strong>
                </button>
              </div>
            </div>

            {exportFormat === 'pdf' && (
              <div className="print-option-group">
                <label>2. Select Paper Size</label>
                <div className="paper-size-list">
                  {PAPER_SIZES.map(ps => (
                    <button
                      type="button"
                      key={ps.value}
                      className={`paper-size-btn ${paperSize === ps.value ? 'active' : ''}`}
                      onClick={() => setPaperSize(ps.value)}
                    >
                      <span>{ps.label}</span>
                      <strong>{paperSize === ps.value ? 'Selected' : ''}</strong>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowPrintModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={handleConfirmPrint}
              >
                {exportFormat === 'pdf' ? `Print (${paperSize})` : 'Download Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}