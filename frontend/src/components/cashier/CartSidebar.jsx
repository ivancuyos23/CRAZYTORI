import React, { useState } from 'react';
import PaymentModal from './PaymentModal';
import './CartSidebar.css';

export default function CartSidebar({
  cart = [],
  updateQty,
  subtotal = 0,
  servingNo = 1,
  setServingNo,
  processCheckout
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const totalItems = cart.reduce(
    (sum, item) => sum + Number(item.qty || item.quantity || 1),
    0
  );

  const handlePaymentComplete = (paymentDetails) => {
    setShowPaymentModal(false);
    setMobileExpanded(false);
    if (typeof processCheckout === 'function') {
      processCheckout(paymentDetails);
    }
  };

  return (
    <div
      className={`cart-sidebar ${cart.length === 0 ? 'cart-empty' : 'cart-has-items'} ${
        mobileExpanded ? 'mobile-open' : ''
      }`}
    >
      {/* Top Cart Header (Tap on mobile to expand/collapse items) */}
      <div
        className="cart-header"
        onClick={() => {
          if (cart.length > 0) setMobileExpanded(prev => !prev);
        }}
      >
        <div className="cart-title-group">
          <h3>
            Current Order {totalItems > 0 ? `(${totalItems})` : ''}
          </h3>
          <span className="date-badge">Serving #{servingNo}</span>
        </div>

        <div
          className="cart-header-controls"
          onClick={e => e.stopPropagation()}
        >
          {setServingNo && (
            <div className="serving-stepper">
              <button
                type="button"
                className="step-btn"
                onClick={() => setServingNo(prev => (prev <= 1 ? 16 : prev - 1))}
                title="Previous Serving #"
              >
                ◀
              </button>
              <button
                type="button"
                className="step-btn"
                onClick={() => setServingNo(prev => (prev >= 16 ? 1 : prev + 1))}
                title="Next Serving #"
              >
                ▶
              </button>
            </div>
          )}

          {cart.length > 0 && (
            <button
              type="button"
              className="mobile-drawer-toggle"
              onClick={() => setMobileExpanded(prev => !prev)}
            >
              {mobileExpanded ? '▼ Hide' : '▲ View'}
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Cart Items */}
      <div className="cart-items-list">
        {cart.length === 0 ? (
          <p className="empty-cart">No items selected yet. Tap menu items to add.</p>
        ) : (
          cart.map((item, idx) => {
            const qty = item.qty || item.quantity || 1;
            const itemKey = item.cartKey || `${item.name}-${item.size || 'regular'}`;
            return (
              <div key={itemKey || idx} className="cart-item-row">
                <div className="cart-item-info">
                  <span className="cart-item-name">
                    {qty}x {item.name} {item.size ? `(${item.size})` : ''}
                  </span>
                  <span className="item-price">
                    ₱{(Number(item.price || 0) * qty).toFixed(2)}
                  </span>
                </div>
                <div className="qty-controls">
                  <button type="button" onClick={() => updateQty(itemKey, -1)}>
                    −
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(itemKey, 1)}
                    className="plus-btn"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Checkout Bar */}
      <div className="cart-footer">
        <div className="subtotal-row">
          <span>Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
          <strong>₱{Number(subtotal || 0).toFixed(2)}</strong>
        </div>
        <button
          type="button"
          className="proceed-btn"
          disabled={cart.length === 0}
          onClick={() => {
            if (cart.length === 0) return;
            setShowPaymentModal(true);
          }}
        >
          PROCEED TO PAY ➔
        </button>
      </div>

      {showPaymentModal && (
        <PaymentModal
          subtotal={subtotal}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handlePaymentComplete}
          onConfirmPayment={handlePaymentComplete}
        />
      )}
    </div>
  );
}