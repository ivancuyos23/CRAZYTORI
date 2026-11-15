import React, { useState } from 'react';
import '../admin/AdminViews.css';
import './TransactionsView.css';

const formatPeso = (num) =>
  Number(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export default function TransactionsView({
  transactions = [],
  role = 'Cashier',
  permissions = {},
  onVoidTransaction
}) {
  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(today);
  const [showAllDates, setShowAllDates] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const canFilterDates = role === 'Admin' || permissions.canFilterTransactionDates;
  const canVoid = role === 'Admin' || permissions.canVoidTransactions;

  const dateFilteredTxs = transactions.filter(tx => {
    if (!tx.date) return false;
    if (canFilterDates && showAllDates) return true;
    const targetDate = canFilterDates ? filterDate : today;
    return tx.date.startsWith(targetDate);
  });

  const cashOrders = dateFilteredTxs.filter(t => t.paymentMethod === 'Cash');
  const gcashOrders = dateFilteredTxs.filter(t => t.paymentMethod === 'GCash');
  const shiftCash = cashOrders.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const shiftGCash = gcashOrders.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const grossShiftTotal = shiftCash + shiftGCash;

  const filteredTxs = dateFilteredTxs.filter(tx => {
    const matchesPayment = paymentFilter === 'All' || tx.paymentMethod === paymentFilter;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesPayment;

    const matchesId = (tx.id || '').toLowerCase().includes(q);
    const matchesRef = (tx.referenceNo || '').toLowerCase().includes(q);
    const matchesServing = tx.servingNo && (`#${tx.servingNo}` === q || String(tx.servingNo) === q);
    const matchesItems = (tx.items || []).some(i => (i.name || '').toLowerCase().includes(q));
    return matchesPayment && (matchesId || matchesRef || matchesServing || matchesItems);
  });

  const filteredRevenue = filteredTxs.reduce((sum, t) => sum + Number(t.total || 0), 0);

  return (
    <div className="admin-page-container">
      {/* Top Header Bar */}
      <div className="admin-header-bar">
        <h2>{role === 'Admin' ? 'Orders' : 'Shift Orders'}</h2>

        {canFilterDates && (
          <div className="tx-date-controls">
            <button
              type="button"
              className={`btn-secondary-sm ${showAllDates ? 'active-all-btn' : ''}`}
              onClick={() => setShowAllDates(!showAllDates)}
            >
              {showAllDates ? 'All Dates: ON' : 'All Dates'}
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

      {/* 4 KPI Summary Cards */}
      <div className="expense-kpi-grid">
        <div className="admin-kpi-card">
          <span>Orders</span>
          <h3>{dateFilteredTxs.length}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>Cash</span>
          <h3>₱{formatPeso(shiftCash)}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>GCash</span>
          <h3>₱{formatPeso(shiftGCash)}</h3>
        </div>
        <div className="admin-kpi-card kpi-highlight-outflow">
          <span>Total Sales</span>
          <h3>₱{formatPeso(grossShiftTotal)}</h3>
        </div>
      </div>

      {/* Order List Card */}
      <div className="admin-card report-sheet">
        <div className="report-sheet-header">
          <h3>Order List ({filteredTxs.length})</h3>
        </div>

        {/* Filter Pills + Search Input */}
        <div className="tx-filter-bar">
          <div className="tx-payment-pills">
            <button
              type="button"
              className={`tx-tab-pill ${paymentFilter === 'All' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('All')}
            >
              All <span>{dateFilteredTxs.length}</span>
            </button>
            <button
              type="button"
              className={`tx-tab-pill ${paymentFilter === 'Cash' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('Cash')}
            >
              Cash <span>{cashOrders.length}</span>
            </button>
            <button
              type="button"
              className={`tx-tab-pill ${paymentFilter === 'GCash' ? 'active' : ''}`}
              onClick={() => setPaymentFilter('GCash')}
            >
              GCash <span>{gcashOrders.length}</span>
            </button>
          </div>

          <div className="tx-search-box">
            <input
              type="text"
              placeholder="Search order, item, or #serving..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="tx-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Responsive Order Cards (No Sideways Scroll) */}
        <div className="tx-ledger-list">
          {filteredTxs.length === 0 ? (
            <div className="ledger-empty">No orders found.</div>
          ) : (
            filteredTxs.map(tx => {
              const isGCash = tx.paymentMethod === 'GCash';
              const timeStr = tx.date
                ? new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
              const dateStr = tx.date
                ? new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '';
              const shortId = (tx.id || '').slice(-6);

              return (
                <div
                  key={tx.id}
                  className={`tx-order-card ${isGCash ? 'pay-gcash' : 'pay-cash'}`}
                >
                  {/* Top Row: Serving #, Time/ID & Payment Badge */}
                  <div className="tx-card-top">
                    <div className="tx-id-group">
                      {tx.servingNo && (
                        <span className="tx-serving-badge">#{tx.servingNo}</span>
                      )}
                      <span className="tx-time-text">{timeStr}</span>
                      <span className="tx-dot">•</span>
                      <span className="tx-date-text">{dateStr}</span>
                      <span className="tx-short-id">({shortId})</span>
                    </div>

                    <div className="tx-pay-group">
                      <span className={`tx-pay-badge ${isGCash ? 'gcash' : 'cash'}`}>
                        {tx.paymentMethod || 'Cash'}
                      </span>
                      {tx.referenceNo && (
                        <span className="tx-ref-tag">Ref: {tx.referenceNo}</span>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Ordered Items */}
                  <div className="tx-items-wrap">
                    {(tx.items || []).map((item, idx) => {
                      const qty = item.qty || item.quantity || 1;
                      return (
                        <span key={idx} className="tx-item-chip">
                          <strong>{qty}x</strong> {item.name}
                          {item.size ? ` (${item.size})` : ''}
                        </span>
                      );
                    })}
                  </div>

                  {/* Bottom Row: Total Price & Receipt / Void Buttons */}
                  <div className="tx-card-bottom">
                    <div className="tx-total-block">
                      <span>Total</span>
                      <strong>₱{formatPeso(tx.total)}</strong>
                    </div>

                    <div className="tx-actions-group">
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        onClick={() => setSelectedReceipt(tx)}
                      >
                        Receipt
                      </button>
                      {canVoid && (
                        <button
                          type="button"
                          className="btn-danger-sm"
                          onClick={() => onVoidTransaction(tx.id)}
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Total */}
        <div className="ledger-total-box">
          <span className="ledger-total-label">TOTAL ({filteredTxs.length} ORDERS)</span>
          <div className="ledger-total-figure">₱{formatPeso(filteredRevenue)}</div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-card thermal-receipt-card" onClick={e => e.stopPropagation()}>
            <div className="thermal-paper">
              <div className="thermal-header">
                <h4>CRAZY TORI</h4>
                <p>CDU Branch</p>
              </div>

              {selectedReceipt.servingNo && (
                <div className="thermal-serving-banner">
                  <span>SERVING</span>
                  <h2>#{selectedReceipt.servingNo}</h2>
                </div>
              )}

              <div className="thermal-meta">
                <div><span>Order ID:</span><strong>{selectedReceipt.id}</strong></div>
                <div><span>Date:</span><span>{new Date(selectedReceipt.date).toLocaleString()}</span></div>
                <div><span>Payment:</span><strong>{selectedReceipt.paymentMethod}</strong></div>
                {selectedReceipt.referenceNo && (
                  <div><span>GCash Ref:</span><strong>{selectedReceipt.referenceNo}</strong></div>
                )}
              </div>

              <div className="thermal-divider"></div>

              <div className="thermal-items">
                {(selectedReceipt.items || []).map((item, idx) => {
                  const qty = Number(item.qty || item.quantity || 1);
                  return (
                    <div key={idx} className="thermal-item-row">
                      <span>
                        <strong>{qty}x</strong> {item.name}
                        {item.size ? ` (${item.size})` : ''}
                      </span>
                      <span>₱{formatPeso(qty * Number(item.price || 0))}</span>
                    </div>
                  );
                })}
              </div>

              <div className="thermal-divider"></div>

              <div className="thermal-total-row">
                {selectedReceipt.paymentProof && (
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                  <div className="thermal-divider"></div>
                  <small style={{ fontWeight: 800, display: 'block', marginBottom: '4px' }}>
                    GCASH PAYMENT PROOF
                  </small>
                  <img
                    src={selectedReceipt.paymentProof}
                    alt="GCash Proof"
                    style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              )}
                <span>TOTAL</span>
                <strong>₱{formatPeso(selectedReceipt.total)}</strong>
              </div>
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
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}