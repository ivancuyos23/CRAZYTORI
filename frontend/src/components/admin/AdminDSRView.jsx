import React, { useState } from 'react';
import { exportDSRAndPnLReport } from '../../services/exportHelper';
import './AdminViews.css';
import './AdminDSRView.css';

const MONTHS = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' }, { value: '04', label: 'Apr' },
  { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' }, { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
];

const YEARS = ['2024', '2025', '2026', '2027', '2028'];

const PAPER_SIZES = [
  { value: 'A4', label: 'A4 Paper' },
  { value: 'Letter', label: 'Short Bond (Letter)' },
  { value: 'Legal', label: 'Long Bond (Legal)' },
  { value: '80mm', label: '80mm Thermal Receipt' }
];

export default function AdminDSRView({
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  transactions = [],
  expenses = []
}) {
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [paperSize, setPaperSize] = useState('A4');

  const todayStr = new Date().toISOString().split('T')[0];
  const activeDate = selectedDate || todayStr;
  const activeMonth = selectedMonth || activeDate.slice(0, 7);

  const [dsrYear, dsrMonth, dsrDay] = activeDate.split('-');
  const daysInDsrMonth = new Date(Number(dsrYear), Number(dsrMonth), 0).getDate();
  const [pnlYear, pnlMonth] = activeMonth.split('-');

  const handleDsrDateChange = (newYear, newMonth, newDay) => {
    const maxDay = new Date(Number(newYear), Number(newMonth), 0).getDate();
    const validDay = String(Math.min(Number(newDay), maxDay)).padStart(2, '0');
    setSelectedDate(`${newYear}-${newMonth}-${validDay}`);
  };

  const handlePnlMonthChange = (newYear, newMonth) => {
    setSelectedMonth(`${newYear}-${newMonth}`);
  };

  // Daily DSR Calculations
  const dailyTxs = transactions.filter(t => t.date && t.date.startsWith(activeDate));
  const dailyExps = expenses.filter(e => e.date && e.date.startsWith(activeDate));

  const gcashTxs = dailyTxs.filter(t => t.paymentMethod === 'GCash');
  const cashTxs = dailyTxs.filter(t => t.paymentMethod === 'Cash');

  const totalGCash = gcashTxs.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const totalCash = cashTxs.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const grossDailySales = totalGCash + totalCash;
  const totalDailyExpenses = dailyExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netDailyRevenue = grossDailySales - totalDailyExpenses;

  const itemizedMap = {};
  let totalItemsSold = 0;
  dailyTxs.forEach(tx => {
    (tx.items || []).forEach(item => {
      const key = item.size ? `${item.name} (${item.size})` : item.name;
      const qty = Number(item.qty || item.quantity || 1);
      const price = Number(item.price || 0);
      if (!itemizedMap[key]) itemizedMap[key] = { qty: 0, revenue: 0 };
      itemizedMap[key].qty += qty;
      itemizedMap[key].revenue += qty * price;
      totalItemsSold += qty;
    });
  });

  // Monthly P&L Calculations
  const monthlyTxs = transactions.filter(t => t.date && t.date.startsWith(activeMonth));
  const monthlyExps = expenses.filter(e => e.date && e.date.startsWith(activeMonth));

  const monthlyCash = monthlyTxs.filter(t => t.paymentMethod === 'Cash').reduce((s, t) => s + Number(t.total || 0), 0);
  const monthlyGCash = monthlyTxs.filter(t => t.paymentMethod === 'GCash').reduce((s, t) => s + Number(t.total || 0), 0);
  const monthlyRevenue = monthlyCash + monthlyGCash;

  const expDailyStore = monthlyExps.filter(e => e.category && e.category.startsWith('Store-Level Daily')).reduce((s, e) => s + Number(e.amount || 0), 0);
  const expFixedOverhead = monthlyExps.filter(e => e.category && e.category.startsWith('Fixed Monthly Overhead')).reduce((s, e) => s + Number(e.amount || 0), 0);
  const expMajorOps = monthlyExps.filter(e => e.category && e.category.startsWith('Major Operational')).reduce((s, e) => s + Number(e.amount || 0), 0);

  const monthlyExpenses = monthlyExps.reduce((s, e) => s + Number(e.amount || 0), 0);
  const monthlyNetProfit = monthlyRevenue - monthlyExpenses;
  const profitMargin = monthlyRevenue > 0 ? ((monthlyNetProfit / monthlyRevenue) * 100).toFixed(1) : '0.0';
  const isProfitable = monthlyNetProfit >= 0;

  const handleConfirmPrint = () => {
    exportDSRAndPnLReport(
      {
        activeDate,
        activeMonth,
        itemizedMap,
        totalItemsSold,
        dailyOrderCount: dailyTxs.length,
        totalGCash,
        gcashCount: gcashTxs.length,
        totalCash,
        cashCount: cashTxs.length,
        grossDailySales,
        dailyExps,
        totalDailyExpenses,
        netDailyRevenue,
        monthlyOrderCount: monthlyTxs.length,
        monthlyCash,
        monthlyGCash,
        monthlyRevenue,
        expDailyStore,
        expFixedOverhead,
        expMajorOps,
        monthlyExpenses,
        monthlyNetProfit,
        profitMargin
      },
      exportFormat,
      paperSize
    );
    setShowPrintModal(false);
  };

  return (
    <div className="admin-page-container">
      {/* Top Bar: Single Print Button Only */}
      <div className="admin-header-bar">
        <h2>DSR & Monthly P&L</h2>
        <button
          type="button"
          className="btn-primary-amber"
          onClick={() => setShowPrintModal(true)}
        >
          🖨️ Print
        </button>
      </div>

      <div className="admin-two-col">
        {/* LEFT: DAILY SALES REPORT */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <h3>Daily Sales (DSR)</h3>
            <div className="header-dropdown-group">
              <select
                value={dsrMonth}
                onChange={e => handleDsrDateChange(dsrYear, e.target.value, dsrDay)}
                className="header-select"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select
                value={dsrDay}
                onChange={e => handleDsrDateChange(dsrYear, dsrMonth, e.target.value)}
                className="header-select"
              >
                {Array.from({ length: daysInDsrMonth }, (_, i) => {
                  const d = String(i + 1).padStart(2, '0');
                  return <option key={d} value={d}>{i + 1}</option>;
                })}
              </select>
              <select
                value={dsrYear}
                onChange={e => handleDsrDateChange(e.target.value, dsrMonth, dsrDay)}
                className="header-select"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="ledger-section">
            <div className="ledger-section-title">
              <span>1. Items Sold</span>
              <span className="ledger-badge">{dailyTxs.length} Orders • {totalItemsSold} Items</span>
            </div>

            {Object.keys(itemizedMap).length === 0 ? (
              <div className="ledger-empty">No sales on this date.</div>
            ) : (
              <div className="mini-table-wrapper">
                <table className="mini-ledger-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(itemizedMap).map(([name, data]) => (
                      <tr key={name}>
                        <td>{name}</td>
                        <td className="text-center"><strong>{data.qty}</strong></td>
                        <td className="text-right">₱{data.revenue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="ledger-section">
            <div className="ledger-row">
              <strong>2. GCash ({gcashTxs.length})</strong>
              <span className="ledger-val">₱{totalGCash.toFixed(2)}</span>
            </div>
            <div className="ledger-row">
              <strong>3. Cash ({cashTxs.length})</strong>
              <span className="ledger-val">₱{totalCash.toFixed(2)}</span>
            </div>
            <div className="ledger-row subtotal-line">
              <span>Gross Sales</span>
              <strong>₱{grossDailySales.toFixed(2)}</strong>
            </div>
          </div>

          <div className="ledger-section">
            <div className="ledger-row">
              <strong>4. Expenses ({dailyExps.length})</strong>
              <span className="ledger-val text-danger">-₱{totalDailyExpenses.toFixed(2)}</span>
            </div>
            {dailyExps.length > 0 && (
              <div className="expense-mini-breakdown">
                {dailyExps.map(exp => (
                  <div key={exp.id} className="expense-mini-row">
                    <span>• {exp.description}</span>
                    <span>-₱{Number(exp.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ledger-total-box">
            <span className="ledger-total-label">5. NET SALES</span>
            <div className="ledger-total-figure">₱{netDailyRevenue.toFixed(2)}</div>
          </div>
        </div>

        {/* RIGHT: MONTHLY P&L */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <h3>Monthly P&L</h3>
            <div className="header-dropdown-group">
              <select
                value={pnlMonth}
                onChange={e => handlePnlMonthChange(pnlYear, e.target.value)}
                className="header-select"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select
                value={pnlYear}
                onChange={e => handlePnlMonthChange(e.target.value, pnlMonth)}
                className="header-select"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className={`pnl-status-card ${isProfitable ? 'status-gain' : 'status-loss'}`}>
            <div className="pnl-status-top">
              <span className="pnl-status-pill">{isProfitable ? '● PROFITABLE' : '● LOSS'}</span>
              <span className="pnl-margin-pill">Margin: {profitMargin}%</span>
            </div>
            <div className="pnl-main-figure">₱{monthlyNetProfit.toFixed(2)}</div>
          </div>

          <div className="ledger-section">
            <div className="ledger-section-title">
              <span>Sales</span>
              <span>{monthlyTxs.length} Orders</span>
            </div>
            <div className="ledger-row">
              <span>Cash</span>
              <span>₱{monthlyCash.toFixed(2)}</span>
            </div>
            <div className="ledger-row">
              <span>GCash</span>
              <span>₱{monthlyGCash.toFixed(2)}</span>
            </div>
            <div className="ledger-row subtotal-line">
              <span>Total Sales</span>
              <strong>₱{monthlyRevenue.toFixed(2)}</strong>
            </div>
          </div>

          <div className="ledger-section">
            <div className="ledger-section-title">
              <span>Expenses</span>
              <span>{monthlyExps.length} Items</span>
            </div>
            <div className="ledger-row">
              <span>Daily Store</span>
              <span>-₱{expDailyStore.toFixed(2)}</span>
            </div>
            <div className="ledger-row">
              <span>Fixed Overhead</span>
              <span>-₱{expFixedOverhead.toFixed(2)}</span>
            </div>
            <div className="ledger-row">
              <span>Major Ops</span>
              <span>-₱{expMajorOps.toFixed(2)}</span>
            </div>
            <div className="ledger-row subtotal-line">
              <span>Total Expenses</span>
              <strong className="text-danger">-₱{monthlyExpenses.toFixed(2)}</strong>
            </div>
          </div>

          <div className="ledger-total-box">
            <span className="ledger-total-label">NET PROFIT</span>
            <div className={`ledger-total-figure ${!isProfitable ? 'text-danger' : ''}`}>
              ₱{monthlyNetProfit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Print / Export Selection Modal */}
      {showPrintModal && (
        <div className="modal-backdrop" onClick={() => setShowPrintModal(false)}>
          <div className="modal-card print-options-modal" onClick={e => e.stopPropagation()}>
            <div className="print-modal-header">
              <h3>Print / Export Report</h3>
              <button
                type="button"
                className="close-x-btn"
                onClick={() => setShowPrintModal(false)}
              >
                ✕
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
                  <span>📄</span>
                  <strong>PDF / Print</strong>
                </button>
                <button
                  type="button"
                  className={`format-choice-btn ${exportFormat === 'excel' ? 'active' : ''}`}
                  onClick={() => setExportFormat('excel')}
                >
                  <span>📊</span>
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
                      <strong>{paperSize === ps.value ? '●' : '○'}</strong>
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
                {exportFormat === 'pdf' ? `🖨️ Print (${paperSize})` : '⬇ Download Excel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}