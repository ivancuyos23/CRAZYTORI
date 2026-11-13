import React, { useState } from 'react';
import '../admin/AdminViews.css';
import './TransactionsView.css';

export default function TransactionsView({
  transactions = [],
  role = 'Cashier',
  permissions = {},
  onVoidTransaction
}) {
  const today = new Date().toISOString().split('T')[0];

  // Filter States
  const [filterDate, setFilterDate] = useState(today);
  const [showAllDates, setShowAllDates] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const canFilterDates = role === 'Admin' || permissions.canFilterTransactionDates;
  const canVoid = role === 'Admin' || permissions.canVoidTransactions;

  // Step 1: Filter by Date (Cashiers default to today's shift unless permitted)
  const dateFilteredTxs = transactions.filter(tx => {
    if (!tx.date) return false;
    if (canFilterDates && showAllDates) return true;
    const targetDate = canFilterDates ? filterDate : today;
    return tx.date.startsWith(targetDate);
  });

  // Step 2: Filter by Payment Method & Search Query
  const filteredTxs = dateFilteredTxs.filter(tx => {
    const matchesPayment =
      paymentFilter === 'All' || tx.paymentMethod === paymentFilter;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesPayment;

    const matchesId = (tx.id || '').toLowerCase().includes(q);
    const matchesRef = (tx.referenceNo || '').toLowerCase().includes(q);
    const matchesServing = tx.servingNo && (`#${tx.servingNo}` === q || String(tx.servingNo) === q);
    const matchesItems = (tx.items || []).some(i =>
      (i.name || '').toLowerCase().includes(q)
    );

    return matchesPayment && (matchesId || matchesRef || matchesServing || matchesItems);
  });

  // Shift / Audit KPI Calculations
  const cashOrders = dateFilteredTxs.filter(t => t.paymentMethod === 'Cash');
  const gcashOrders = dateFilteredTxs.filter(t => t.paymentMethod === 'GCash');

  const shiftCash = cashOrders.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const shiftGCash = gcashOrders.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const grossShiftTotal = shiftCash + shiftGCash;

  const totalItemsSold = dateFilteredTxs.reduce(
    (sum, tx) => sum + (tx.items || []).reduce((s, i) => s + Number(i.qty || i.quantity || 1), 0),
    0
  );

  const filteredRevenue = filteredTxs.reduce((sum, t) => sum + Number(t.total || 0), 0);

  return (
    <div className="admin-page-container">
      {/* Top Header & Date Controls */}
      <div className="admin-header-bar">
        <div>
          <h2>
            {role === 'Admin'
              ? 'Orders & Transaction Audit'
              : "Today's Shift Orders (X-Reading)"}
          </h2>
          <p className="admin-subtitle">
            {canFilterDates
              ? 'Inspect order slips, verify GCash references, reprint receipts, or void entries'
              : `Live register shift summary and receipt slips for ${today}`}
          </p>
        </div>

        {canFilterDates && (
          <div className="expense-filter-bar">
            <button
              type="button"
              className={`preset-chip ${showAllDates ? 'active' : ''}`}
              onClick={() => setShowAllDates(!showAllDates)}
              style={{ padding: '7px 12px' }}
            >
              {showAllDates ? '✓ Showing All Dates' : 'View All Dates'}
            </button>

            {!showAllDates && (
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="admin-date-input"
              />
            )}
          </div>
        )}
      </div>

      {/* 4-Card KPI Summary Bar */}
      <div className="expense-kpi-grid">
        <div className="admin-kpi-card">
          <span>Orders Processed</span>
          <h3>{dateFilteredTxs.length} Slips</h3>
          <small className="kpi-sub">{totalItemsSold} total items served</small>
        </div>

        <div className="admin-kpi-card">
          <span>Cash Drawer Total</span>
          <h3>₱{shiftCash.toFixed(2)}</h3>
          <small className="kpi-sub">{cashOrders.length} cash transactions</small>
        </div>

        <div className="admin-kpi-card">
          <span>GCash Digital Total</span>
          <h3>₱{shiftGCash.toFixed(2)}</h3>
          <small className="kpi-sub">{gcashOrders.length} digital transfers</small>
        </div>

        <div className="admin-kpi-card kpi-highlight-outflow">
          <span>Combined Gross Sales</span>
          <h3>₱{grossShiftTotal.toFixed(2)}</h3>
          <small className="kpi-sub">
            {showAllDates ? 'All recorded dates' : `Date: ${canFilterDates ? filterDate : today}`}
          </small>
        </div>
      </div>

      {/* Main Orders & Audit Ledger Card */}
      <div className="admin-card report-sheet">
        <div className="report-sheet-header">
          <div>
            <span className="report-tag">
              {role === 'Admin' ? 'OFFICIAL AUDIT LOG' : 'SHIFT REGISTER LOG'}
            </span>
            <h3>Order Slips ({filteredTxs.length})</h3>
          </div>

          <div className="audit-controls-row">
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="audit-filter-select"
            >
              <option value="All">All Payments</option>
              <option value="Cash">💵 Cash Only</option>
              <option value="GCash">📱 GCash Only</option>
            </select>

            <input
              type="text"
              placeholder="Search ID, #Serving, item, Ref..."
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
                <th>Order ID & Serving</th>
                <th>Date & Time</th>
                <th>Ordered Items</th>
                <th>Payment Tender</th>
                <th className="text-right">Total</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No order slips match your current filter.
                  </td>
                </tr>
              ) : (
                filteredTxs.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div className="order-id-cell">
                        <span className="tx-mono-id">{tx.id}</span>
                        {tx.servingNo && (
                          <span className="serving-pill">
                            🍽️ #{tx.servingNo}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="tx-time-cell">
                        <strong>
                          {new Date(tx.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </strong>
                        <small>{tx.date.split('T')[0]}</small>
                      </div>
                    </td>

                    <td>
                      <div className="size-pills-wrap">
                        {(tx.items || []).map((item, idx) => (
                          <span key={idx} className="item-pill">
                            <strong>{item.qty || item.quantity || 1}x</strong> {item.name}{' '}
                            {item.size ? `(${item.size})` : ''}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <div className="tx-tender-cell">
                        <span className="method-badge">
                          {tx.paymentMethod === 'GCash' ? '📱 GCash' : '💵 Cash'}
                        </span>
                        {tx.referenceNo && (
                          <small className="tx-ref-note">Ref: {tx.referenceNo}</small>
                        )}
                      </div>
                    </td>

                    <td className="text-right">
                      <strong className="tx-amount-figure">
                        ₱{Number(tx.total || 0).toFixed(2)}
                      </strong>
                    </td>

                    <td className="text-right">
                      <div className="action-cell" style={{ justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary-sm"
                          onClick={() => setSelectedReceipt(tx)}
                        >
                          🧾 Receipt
                        </button>
                        {canVoid && (
                          <button
                            className="btn-danger-sm"
                            onClick={() => onVoidTransaction(tx.id)}
                          >
                            Void
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Summary Footer */}
        <div className="ledger-total-box">
          <div>
            <span className="ledger-total-label">FILTERED ORDERS TOTAL</span>
            <small>
              Showing {filteredTxs.length} of {dateFilteredTxs.length} slips ({paymentFilter})
            </small>
          </div>
          <div className="ledger-total-figure">₱{filteredRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Printable Thermal Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div
            className="modal-card thermal-receipt-card"
            onClick={e => e.stopPropagation()}
          >
            <div className="thermal-paper">
              <div className="thermal-header">
                <h4>CRAZY TORI</h4>
                <p>チキンポッパー • CDU Branch</p>
                <small>Official Order & Kitchen Slip</small>
              </div>

              {selectedReceipt.servingNo && (
                <div className="thermal-serving-banner">
                  <span>SERVING NUMBER</span>
                  <h2>#{selectedReceipt.servingNo}</h2>
                </div>
              )}

              <div className="thermal-meta">
                <div>
                  <span>Order ID:</span>
                  <strong>{selectedReceipt.id}</strong>
                </div>
                <div>
                  <span>Date & Time:</span>
                  <span>{new Date(selectedReceipt.date).toLocaleString()}</span>
                </div>
                <div>
                  <span>Handled By:</span>
                  <span>{selectedReceipt.cashierName || 'Cashier'}</span>
                </div>
                <div>
                  <span>Payment Method:</span>
                  <strong>{selectedReceipt.paymentMethod}</strong>
                </div>
                {selectedReceipt.referenceNo && (
                  <div>
                    <span>GCash Ref No:</span>
                    <strong>{selectedReceipt.referenceNo}</strong>
                  </div>
                )}
              </div>

              <div className="thermal-divider"></div>

              <div className="thermal-items">
                {(selectedReceipt.items || []).map((item, idx) => {
                  const qty = Number(item.qty || item.quantity || 1);
                  const lineTotal = qty * Number(item.price || 0);
                  return (
                    <div key={idx} className="thermal-item-row">
                      <span>
                        <strong>{qty}x</strong> {item.name}{' '}
                        {item.size ? `(${item.size})` : ''}
                      </span>
                      <span>₱{lineTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="thermal-divider"></div>

              <div className="thermal-total-row">
                <span>TOTAL PAID ({selectedReceipt.paymentMethod})</span>
                <strong>₱{Number(selectedReceipt.total || 0).toFixed(2)}</strong>
              </div>

              <p className="thermal-footer-note">Thank you for dining at Crazy Tori!</p>
            </div>

            <div className="modal-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setSelectedReceipt(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={() => window.print()}
              >
                🖨️ Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}