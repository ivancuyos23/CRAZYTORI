import React, { useState, useEffect } from 'react';
import { PaginationBar } from '../layout/UIFeedback';
import '../admin/AdminViews.css';
import './TransactionsView.css';

const ORDERS_PER_PAGE = 8;

export default function TransactionsView({
  transactions = [],
  waitingOrders = [],
  onCompleteOrder,
  onCancelWaiting,
  selectedDate,
  setSelectedDate,
  role,
  permissions = {},
  onVoidTransaction
}) {
  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate] = useState(selectedDate || today);
  const [showAllDates, setShowAllDates] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (createdAt) => {
    const startMs = new Date(createdAt).getTime() || Date.now();
    const diffSec = Math.max(0, Math.floor((now - startMs) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    const isOverdue = diffSec >= 300;
    const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return { label, isOverdue };
  };

  const canFilterDates = role === 'Admin' || permissions.canFilterTransactionDates;
  const canVoid = role === 'Admin' || permissions.canVoidTransactions;
  const activeDate = canFilterDates ? filterDate : today;

  const dateFilteredTxs = transactions.filter(t => {
    if (canFilterDates && showAllDates) return true;
    return (t.date || '').startsWith(activeDate);
  });

  const filteredTxs = dateFilteredTxs.filter(t => {
    const matchesPayment =
      paymentFilter === 'ALL' ||
      (t.paymentMethod || '').toLowerCase() === paymentFilter.toLowerCase();

    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesPayment;

    const idMatch = (t.id || '').toLowerCase().includes(q);
    const servingMatch = String(t.servingNo || '').includes(q);
    const refMatch = (t.referenceNo || '').toLowerCase().includes(q);
    const itemMatch = (t.items || []).some(i =>
      (i.name || '').toLowerCase().includes(q)
    );

    return matchesPayment && (idMatch || servingMatch || refMatch || itemMatch);
  });

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredTxs.length / ORDERS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTxs = filteredTxs.slice(
    (safePage - 1) * ORDERS_PER_PAGE,
    safePage * ORDERS_PER_PAGE
  );

  const shiftCash = dateFilteredTxs
    .filter(t => t.paymentMethod === 'Cash')
    .reduce((s, t) => s + Number(t.total || 0), 0);

  const shiftGCash = dateFilteredTxs
    .filter(t => t.paymentMethod === 'GCash')
    .reduce((s, t) => s + Number(t.total || 0), 0);

  const combinedTotal = shiftCash + shiftGCash;

  const handleDateChange = (val) => {
    setFilterDate(val);
    setShowAllDates(false);
    setCurrentPage(1);
    if (setSelectedDate) setSelectedDate(val);
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header-bar">
        <div>
          <h2>{role === 'Admin' ? 'Orders & Audit' : 'Shift Orders'}</h2>
          <p className="admin-subtitle">
            {canFilterDates
              ? showAllDates
                ? 'Showing all recorded transactions across all dates'
                : `Showing orders for ${activeDate}`
              : `Today's Shift Summary (${today})`}
          </p>
        </div>

        {canFilterDates && (
          <div className="tx-date-controls">
            <input
              type="date"
              value={filterDate}
              onChange={e => handleDateChange(e.target.value)}
              className="admin-date-input"
            />
            <button
              type="button"
              className={`btn-secondary-sm ${showAllDates ? 'active-all-btn' : ''}`}
              onClick={() => {
                setShowAllDates(!showAllDates);
                setCurrentPage(1);
              }}
            >
              {showAllDates ? '✓ All Dates' : 'All Dates'}
            </button>
          </div>
        )}
      </div>

      <div className="expense-kpi-grid">
        <div className="admin-kpi-card">
          <span>Completed Orders</span>
          <h3>{dateFilteredTxs.length} Slips</h3>
        </div>
        <div className="admin-kpi-card">
          <span>Cash Drawer</span>
          <h3>₱{shiftCash.toFixed(2)}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>GCash Total</span>
          <h3>₱{shiftGCash.toFixed(2)}</h3>
        </div>
        <div className="admin-kpi-card">
          <span>Gross Sales</span>
          <h3>₱{combinedTotal.toFixed(2)}</h3>
        </div>
      </div>

      {/* CONTAINER 1 (ABOVE): PENDING ORDERS / WAITING LIST */}
      <div className="admin-card report-sheet" style={{ marginBottom: '14px' }}>
        <div className="report-sheet-header">
          <div>
            <span className="report-tag">LIVE KITCHEN QUEUE</span>
            <h3>⏳ Pending Orders ({waitingOrders.length})</h3>
          </div>
          <span className="ledger-badge">Turns Red at 05:00</span>
        </div>

        {waitingOrders.length === 0 ? (
          <div className="pending-empty-box">
            No pending orders right now. Orders placed at checkout appear here first.
          </div>
        ) : (
          <div className="pending-orders-grid">
            {waitingOrders.map(order => {
              const { label, isOverdue } = formatElapsed(order.createdAt || order.date);
              return (
                <div
                  key={order.id}
                  className={`pending-order-card ${isOverdue ? 'overdue-red' : ''}`}
                >
                  <div className="pending-card-top">
                    <div className="tx-id-group">
                      <span className="tx-serving-badge">
                        Serving #{order.servingNo || '-'}
                      </span>
                      <span className="tx-short-id">{order.id}</span>
                    </div>

                    <div className={`pending-timer-pill ${isOverdue ? 'timer-red' : ''}`}>
                      ⏱️ {label}
                    </div>
                  </div>

                  <div className="tx-items-wrap">
                    {(order.items || []).map((item, idx) => (
                      <span key={idx} className="tx-item-chip">
                        <strong>{item.qty || item.quantity || 1}x</strong>
                        {item.name} {item.size ? `(${item.size})` : ''}
                      </span>
                    ))}
                  </div>

                  <div className="pending-card-bottom">
                    <div className="tx-total-block">
                      <span className={`tx-pay-badge ${(order.paymentMethod || 'Cash').toLowerCase()}`}>
                        {order.paymentMethod || 'Cash'}
                      </span>
                      <strong>₱{Number(order.total || 0).toFixed(2)}</strong>
                    </div>

                    <div className="tx-actions-group">
                      {onCancelWaiting && (
                        <button
                          type="button"
                          className="btn-danger-sm"
                          onClick={() => onCancelWaiting(order.id)}
                          title="Cancel Pending Order"
                        >
                          ✕
                        </button>
                      )}
                      <button
                        type="button"
                        className="pending-done-btn"
                        onClick={() => onCompleteOrder && onCompleteOrder(order)}
                      >
                        ✓ Done / Served
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTAINER 2 (BELOW): COMPLETED ORDER LIST WITH PAGING */}
      <div className="admin-card report-sheet">
        <div className="report-sheet-header">
          <div>
            <span className="report-tag">COMPLETED LEDGER</span>
            <h3>📋 Order List ({filteredTxs.length})</h3>
          </div>
          <span className="ledger-badge">
            Page {safePage} of {totalPages}
          </span>
        </div>

        <div className="tx-filter-bar">
          <div className="tx-payment-pills">
            {['ALL', 'Cash', 'GCash'].map(method => (
              <button
                key={method}
                type="button"
                className={paymentFilter === method ? 'tx-tab-pill active' : 'tx-tab-pill'}
                onClick={() => {
                  setPaymentFilter(method);
                  setCurrentPage(1);
                }}
              >
                {method === 'ALL' ? 'All' : method}
              </button>
            ))}
          </div>

          <div className="tx-search-box">
            <input
              type="text"
              placeholder="🔍 Search order, serving #, item, or ref..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="tx-clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="tx-ledger-list">
          {pagedTxs.length === 0 ? (
            <div className="pending-empty-box">
              No completed orders found for this filter.
            </div>
          ) : (
            pagedTxs.map(tx => {
              const isGCash = (tx.paymentMethod || '').toLowerCase() === 'gcash';
              const timeStr = new Date(tx.date).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });
              const dateStr = (tx.date || '').split('T')[0];

              return (
                <div
                  key={tx.id}
                  className={`tx-order-card ${isGCash ? 'pay-gcash' : 'pay-cash'}`}
                >
                  <div className="tx-card-top">
                    <div className="tx-id-group">
                      {tx.servingNo && (
                        <span className="tx-serving-badge">
                          Serving #{tx.servingNo}
                        </span>
                      )}
                      <span className="tx-time-text">{timeStr}</span>
                      <span className="tx-dot">•</span>
                      <span className="tx-date-text">{dateStr}</span>
                      <span className="tx-short-id">{tx.id}</span>
                    </div>

                    <div className="tx-pay-group">
                      <span className={`tx-pay-badge ${isGCash ? 'gcash' : 'cash'}`}>
                        {tx.paymentMethod}
                      </span>
                      {tx.referenceNo && (
                        <span className="tx-ref-tag">Ref: {tx.referenceNo}</span>
                      )}
                    </div>
                  </div>

                  <div className="tx-items-wrap">
                    {(tx.items || []).map((item, idx) => (
                      <span key={idx} className="tx-item-chip">
                        <strong>{item.qty || item.quantity || 1}x</strong>
                        {item.name} {item.size ? `(${item.size})` : ''}
                      </span>
                    ))}
                  </div>

                  <div className="tx-card-bottom">
                    <div className="tx-total-block">
                      <span>Total</span>
                      <strong>₱{Number(tx.total || 0).toFixed(2)}</strong>
                    </div>

                    <div className="tx-actions-group">
                      <button
                        type="button"
                        className="btn-secondary-sm"
                        onClick={() => setSelectedReceipt(tx)}
                      >
                        🧾 Receipt
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

        <PaginationBar
          currentPage={safePage}
          totalItems={filteredTxs.length}
          pageSize={ORDERS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* MALL-STYLE THERMAL RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="modal-backdrop" onClick={() => setSelectedReceipt(null)}>
          <div
            className="modal-card mall-receipt-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="mall-thermal-paper">
              <div className="mall-paper-zag-top" />

              <div className="mall-receipt-header">
                <h2>CRAZY TORI</h2>
                <p className="mall-sub-brand">JAPANESE STREET FOOD • CDU BRANCH</p>
                <p className="mall-address">PVG2+64H, Gov. M. Cuenco Ave, Cebu City, 6000 Cebu</p>
                <span className="mall-slip-badge">OFFICIAL ORDER SLIP</span>
              </div>

              <div className="mall-serving-box">
                <span>QUEUE / SERVING NO.</span>
                <h1>#{String(selectedReceipt.servingNo || 1).padStart(2, '0')}</h1>
              </div>

              <div className="mall-double-divider" />

              <div className="mall-meta-grid">
                <div>
                  <span>SLIP NO:</span>
                  <strong>{selectedReceipt.id}</strong>
                </div>
                <div>
                  <span>DATE & TIME:</span>
                  <strong>
                    {new Date(selectedReceipt.date).toLocaleDateString()}{' '}
                    {new Date(selectedReceipt.date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </strong>
                </div>
                <div>
                  <span>CASHIER:</span>
                  <strong>{(selectedReceipt.cashierName || role || 'CASHIER').toUpperCase()}</strong>
                </div>
                <div>
                  <span>TENDER:</span>
                  <strong>{(selectedReceipt.paymentMethod || 'CASH').toUpperCase()}</strong>
                </div>
                {selectedReceipt.referenceNo && (
                  <div className="mall-ref-row">
                    <span>GCASH REF #:</span>
                    <strong>{selectedReceipt.referenceNo}</strong>
                  </div>
                )}
              </div>

              <div className="mall-double-divider" />

              <div className="mall-items-Header">
                <span className="col-qty">QTY</span>
                <span className="col-item">DESCRIPTION</span>
                <span className="col-amt">AMOUNT</span>
              </div>

              <div className="mall-dashed-divider" />

              <div className="mall-items-body">
                {(selectedReceipt.items || []).map((item, i) => {
                  const qty = Number(item.qty || item.quantity || 1);
                  const unitPrice = Number(item.price || 0);
                  const lineTotal = qty * unitPrice;
                  return (
                    <div key={i} className="mall-item-entry">
                      <div className="mall-item-main">
                        <span className="col-qty">{qty}</span>
                        <span className="col-item">
                          {item.name} {item.size ? `(${item.size})` : ''}
                        </span>
                        <span className="col-amt">₱{lineTotal.toFixed(2)}</span>
                      </div>
                      <div className="mall-item-sub">
                        @ ₱{unitPrice.toFixed(2)} each
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mall-double-divider" />

              <div className="mall-totals-section">
                <div className="mall-total-line">
                  <span>ITEMS COUNT</span>
                  <span>
                    {(selectedReceipt.items || []).reduce(
                      (sum, i) => sum + Number(i.qty || i.quantity || 1),
                      0
                    )}
                  </span>
                </div>

                <div className="mall-grand-total-line">
                  <span>TOTAL PAID</span>
                  <span>₱{Number(selectedReceipt.total || 0).toFixed(2)}</span>
                </div>

                <div className="mall-total-line">
                  <span>PAYMENT ({selectedReceipt.paymentMethod || 'Cash'})</span>
                  <span>
                    ₱{Number(selectedReceipt.cashGiven || selectedReceipt.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedReceipt.paymentProof && (
                <>
                  <div className="mall-dashed-divider" />
                  <div className="mall-gcash-proof-box">
                    <div className="mall-proof-header">
                      <span>📷 ATTACHED GCASH PROOF</span>
                      <small>Tap photo for Full Screen</small>
                    </div>
                    <div
                      className="mall-proof-thumb-wrap"
                      onClick={() => setFullScreenImage(selectedReceipt.paymentProof)}
                      title="Click to view full screen"
                    >
                      <img
                        src={selectedReceipt.paymentProof}
                        alt="GCash Payment Proof"
                      />
                      <span className="mall-zoom-pill">🔍 Tap to Expand Full Screen</span>
                    </div>
                  </div>
                </>
              )}

              <div className="mall-dashed-divider" />

              <div className="mall-receipt-footer">
                <div className="mall-barcode-bars" />
                <span className="mall-barcode-text">*{selectedReceipt.id}*</span>
                <p>THANK YOU FOR DINING AT CRAZY TORI!</p>
                <small>Please present this slip when claiming your order.</small>
              </div>

              <div className="mall-paper-zag-bottom" />
            </div>

            <div className="modal-buttons" style={{ marginTop: '12px' }}>
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
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN GCASH IMAGE VIEWER */}
      {fullScreenImage && (
        <div
          className="fullscreen-img-backdrop"
          onClick={() => setFullScreenImage(null)}
        >
          <div
            className="fullscreen-img-topbar"
            onClick={e => e.stopPropagation()}
          >
            <span>📷 GCash Payment Proof (Full Screen)</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={fullScreenImage}
                download={`GCash-${selectedReceipt?.id || 'Proof'}.jpg`}
                className="fullscreen-action-btn"
              >
                ⬇ Save Photo
              </a>
              <button
                type="button"
                className="fullscreen-close-btn"
                onClick={() => setFullScreenImage(null)}
              >
                ✕ Close
              </button>
            </div>
          </div>

          <img
            src={fullScreenImage}
            alt="Full Screen GCash Proof"
            className="fullscreen-img-content"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}