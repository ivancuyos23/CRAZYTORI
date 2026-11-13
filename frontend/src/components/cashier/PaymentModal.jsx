import React, { useState } from 'react';
import './PaymentModal.css';

export default function PaymentModal({ subtotal, onClose, onComplete }) {
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashReceived, setCashReceived] = useState('');
  const [gcashRef, setGcashRef] = useState('');

  const numericCash = parseFloat(cashReceived) || 0;
  const change = numericCash - subtotal;

  const quickDenominations = [50, 100, 200, 500, 1000];

  const handleConfirm = (e) => {
    e.preventDefault();
    if (paymentMethod === 'Cash' && numericCash < subtotal) {
      alert('Cash received is less than the total amount due!');
      return;
    }
    onComplete({
      paymentMethod,
      cashReceived: paymentMethod === 'Cash' ? numericCash : subtotal,
      change: paymentMethod === 'Cash' ? change : 0,
      gcashRef: paymentMethod === 'GCash' ? gcashRef : null
    });
  };

  return (
    <div className="payment-modal-backdrop">
      <div className="payment-modal-card">
        <div className="payment-modal-header">
          <h3>Confirm Payment</h3>
          <button type="button" className="close-x-btn" onClick={onClose}>✕</button>
        </div>

        <div className="total-due-banner">
          <span>Total Amount Due</span>
          <h2>₱{subtotal.toFixed(2)}</h2>
        </div>

        <div className="payment-method-selector">
          <button
            type="button"
            className={`method-card ${paymentMethod === 'Cash' ? 'active-cash' : ''}`}
            onClick={() => setPaymentMethod('Cash')}
          >
            <span className="icon">💵</span>
            <div>
              <strong>Cash</strong>
              <p>Physical bills & coins</p>
            </div>
          </button>

          <button
            type="button"
            className={`method-card ${paymentMethod === 'GCash' ? 'active-gcash' : ''}`}
            onClick={() => setPaymentMethod('GCash')}
          >
            <span className="icon">📱</span>
            <div>
              <strong>GCash</strong>
              <p>Digital / QR transfer</p>
            </div>
          </button>
        </div>

        <form onSubmit={handleConfirm}>
          {paymentMethod === 'Cash' ? (
            <div className="input-group">
              <label>Cash Received (₱)</label>
              <input
                type="number"
                step="any"
                placeholder="Enter amount tendered..."
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="styled-input-lg"
                autoFocus
                required
              />

              <div className="quick-cash-row">
                {quickDenominations.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setCashReceived(String(amt))}
                  >
                    ₱{amt}
                  </button>
                ))}
              </div>

              <div className={`change-box ${change < 0 ? 'invalid' : ''}`}>
                <span>Change Due</span>
                <h3>₱{change >= 0 ? change.toFixed(2) : '0.00'}</h3>
              </div>
            </div>
          ) : (
            <div className="input-group">
              <div className="gcash-qr-box">
                <div className="qr-simulated">
                  <span>📲</span>
                  <p>Crazy Tori GCash QR</p>
                  <small>Verify customer transfer before confirming</small>
                </div>
              </div>
              <label>Reference No. (Optional)</label>
              <input
                type="text"
                placeholder="Last 4-6 digits of GCash Ref..."
                value={gcashRef}
                onChange={(e) => setGcashRef(e.target.value)}
                className="styled-input-lg"
              />
            </div>
          )}

          <div className="payment-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm">
              Complete Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}