import React from 'react';
import './AdminViews.css';
import './AdminDSRView.css';

export default function AdminDSRView({
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  transactions = [],
  expenses = []
}) {
  // --- DAILY SALES REPORT (DSR) CALCULATIONS ---
  const dailyTxs = transactions.filter(t => t.date && t.date.startsWith(selectedDate));
  const dailyExps = expenses.filter(e => e.date && e.date.startsWith(selectedDate));

  const gcashTxs = dailyTxs.filter(t => t.paymentMethod === 'GCash');
  const cashTxs = dailyTxs.filter(t => t.paymentMethod === 'Cash');

  const totalGCash = gcashTxs.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const totalCash = cashTxs.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const grossDailySales = totalGCash + totalCash;
  const totalDailyExpenses = dailyExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netDailyRevenue = grossDailySales - totalDailyExpenses;

  // Step 1: Aggregate Itemized Sales
  const itemizedMap = {};
  let totalItemsSold = 0;
  dailyTxs.forEach(tx => {
    (tx.items || []).forEach(item => {
      const key = item.size ? `${item.name} (${item.size})` : item.name;
      const qty = Number(item.qty || item.quantity || 1);
      const price = Number(item.price || 0);
      if (!itemizedMap[key]) itemizedMap[key] = { qty: 0, price, revenue: 0 };
      itemizedMap[key].qty += qty;
      itemizedMap[key].revenue += qty * price;
      totalItemsSold += qty;
    });
  });

  // --- MONTHLY PROFIT & LOSS (P&L) CALCULATIONS ---
  const monthlyTxs = transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  const monthlyExps = expenses.filter(e => e.date && e.date.startsWith(selectedMonth));

  const monthlyCash = monthlyTxs
    .filter(t => t.paymentMethod === 'Cash')
    .reduce((sum, t) => sum + Number(t.total || 0), 0);
  const monthlyGCash = monthlyTxs
    .filter(t => t.paymentMethod === 'GCash')
    .reduce((sum, t) => sum + Number(t.total || 0), 0);
  const monthlyRevenue = monthlyCash + monthlyGCash;

  // Group Monthly Expenses by the 3 Operational Tiers
  const expDailyStore = monthlyExps
    .filter(e => e.category && e.category.startsWith('Store-Level Daily'))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const expFixedOverhead = monthlyExps
    .filter(e => e.category && e.category.startsWith('Fixed Monthly Overhead'))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const expMajorOps = monthlyExps
    .filter(e => e.category && e.category.startsWith('Major Operational'))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const monthlyExpenses = monthlyExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const monthlyNetProfit = monthlyRevenue - monthlyExpenses;
  const profitMargin = monthlyRevenue > 0 ? ((monthlyNetProfit / monthlyRevenue) * 100).toFixed(1) : '0.0';
  const isProfitable = monthlyNetProfit >= 0;

  return (
    <div className="admin-page-container">
      {/* Top Page Title & Print Action */}
      <div className="admin-header-bar">
        <div>
          <h2>Financial Reports — DSR & Monthly P&L</h2>
          <p className="admin-subtitle">
            End-of-day register reconciliation and monthly store profitability statement
          </p>
        </div>
        <button className="btn-secondary-sm" onClick={() => window.print()}>
          🖨️ Print Financial Report
        </button>
      </div>

      <div className="admin-two-col">
        {/* ================= LEFT COLUMN: DAILY SALES REPORT (DSR) ================= */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">Z-READING / END-OF-DAY</span>
              <h3>Daily Sales Report (DSR)</h3>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="admin-date-input"
            />
          </div>

          {/* 1. Itemized Sales / Orders */}
          <div className="ledger-section">
            <div className="ledger-section-title">
              <span>1. Itemized Sales / Orders</span>
              <span className="ledger-badge">{dailyTxs.length} Orders • {totalItemsSold} Items</span>
            </div>

            {Object.keys(itemizedMap).length === 0 ? (
              <div className="ledger-empty">No orders recorded for {selectedDate}.</div>
            ) : (
              <div className="mini-table-wrapper">
                <table className="mini-ledger-table">
                  <thead>
                    <tr>
                      <th>Menu Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Sales</th>
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

          {/* 2 & 3. Payment Tender Breakdown */}
          <div className="ledger-section">
            <div className="ledger-row">
              <div>
                <strong>2. GCash Result</strong>
                <small className="ledger-sub">{gcashTxs.length} digital transactions</small>
              </div>
              <span className="ledger-val">₱{totalGCash.toFixed(2)}</span>
            </div>

            <div className="ledger-row">
              <div>
                <strong>3. Cash on Hand</strong>
                <small className="ledger-sub">{cashTxs.length} cash drawer transactions</small>
              </div>
              <span className="ledger-val">₱{totalCash.toFixed(2)}</span>
            </div>

            <div className="ledger-row subtotal-line">
              <span>Gross Daily Sales (Cash + GCash)</span>
              <strong>₱{grossDailySales.toFixed(2)}</strong>
            </div>
          </div>

          {/* 4. Daily Expenses */}
          <div className="ledger-section">
            <div className="ledger-row">
              <div>
                <strong>4. Daily Expenses Deducted</strong>
                <small className="ledger-sub">{dailyExps.length} outflow entries logged</small>
              </div>
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

          {/* 5. Total Sales / Net Revenue */}
          <div className="ledger-total-box">
            <div>
              <span className="ledger-total-label">5. TOTAL SALES / NET REVENUE</span>
              <small>Gross Sales less Daily Expenses</small>
            </div>
            <div className="ledger-total-figure">₱{netDailyRevenue.toFixed(2)}</div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: MONTHLY PROFIT & LOSS (P&L) ================= */}
        <div className="admin-card report-sheet">
          <div className="report-sheet-header">
            <div>
              <span className="report-tag">MONTHLY STATEMENT</span>
              <h3>Profit & Loss (P&L) Overview</h3>
            </div>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="admin-date-input"
            />
          </div>

          {/* Executive Status Summary Banner */}
          <div className={`pnl-status-card ${isProfitable ? 'status-gain' : 'status-loss'}`}>
            <div className="pnl-status-top">
              <span className="pnl-status-pill">
                {isProfitable ? '● STORE IS GAINING (PROFITABLE)' : '● OPERATING AT A LOSS'}
              </span>
              <span className="pnl-margin-pill">Margin: {profitMargin}%</span>
            </div>
            <div className="pnl-main-figure">₱{monthlyNetProfit.toFixed(2)}</div>
            <p className="pnl-status-caption">
              Net Profit for {selectedMonth} across {monthlyTxs.length} total orders
            </p>
          </div>

          {/* Revenue Breakdown */}
          <div className="ledger-section">
            <div className="ledger-section-title">
              <span>Gross Revenue Breakdown</span>
              <span>{monthlyTxs.length} Slips</span>
            </div>
            <div className="ledger-row">
              <span>Physical Cash Sales</span>
              <span>₱{monthlyCash.toFixed(2)}</span>
            </div>
            <div className="ledger-row">
              <span>GCash Digital Sales</span>
              <span>₱{monthlyGCash.toFixed(2)}</span>
            </div>
            <div className="ledger-row subtotal-line">
              <span>Total Gross Monthly Revenue</span>
              <strong>₱{monthlyRevenue.toFixed(2)}</strong>
            </div>
          </div>

          {/* 3-Tier Categorized Expense Breakdown */}
          <div className="ledger-section">
            <div className="ledger-section-title">
              <span>Operating Expenses by Category</span>
              <span>{monthlyExps.length} Entries</span>
            </div>
            <div className="ledger-row">
              <span>Store-Level Daily (Ingredients, Packaging)</span>
              <span>-₱{expDailyStore.toFixed(2)}</span>
            </div>
            <div className="ledger-row">
              <span>Fixed Monthly Overhead (Rent, Utilities)</span>
              <span>-₱{expFixedOverhead.toFixed(2)}</span>
            </div>
            <div className="ledger-row">
              <span>Major Operational (Commissary, Salaries)</span>
              <span>-₱{expMajorOps.toFixed(2)}</span>
            </div>
            <div className="ledger-row subtotal-line">
              <span>Total Monthly Expenses</span>
              <strong className="text-danger">-₱{monthlyExpenses.toFixed(2)}</strong>
            </div>
          </div>

          {/* Bottom-Line Net Profit Footer */}
          <div className="ledger-total-box">
            <div>
              <span className="ledger-total-label">NET MONTHLY PROFIT / LOSS</span>
              <small>Total Revenue less All Operating Tiers</small>
            </div>
            <div className={`ledger-total-figure ${!isProfitable ? 'text-danger' : ''}`}>
              ₱{monthlyNetProfit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
