import React from 'react';
import { resolveProductImage } from '../admin/AdminMenuView';
import './CartSidebar.css';

export default function CartSidebar({
  cart = [],
  updateQty,
  subtotal = 0,
  servingNo = 1,
  setServingNo,
  processCheckout
}) {
  const totalItems = cart.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);

  return (
    <div className="cart-sidebar">
      <div className="cart-header">
        <div className="cart-title-group">
          <h3>Current Order</h3>
          <span className="cart-count-badge">{totalItems} items</span>
        </div>

        <div className="serving-selector-pill">
          <span>🍽️</span>
          <select
            value={servingNo}
            onChange={e => setServingNo && setServingNo(Number(e.target.value))}
            aria-label="Serving Number"
          >
            {Array.from({ length: 16 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>
                Serving #{num}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="cart-items-list">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <span className="empty-cart-icon">🛒</span>
            <p>No items added</p>
          </div>
        ) : (
          cart.map((item, index) => {
            const itemImage = resolveProductImage(item);
            const qty = item.qty || item.quantity || 1;
            return (
              <div key={item.cartKey || index} className="cart-item-row">
                <div className="cart-item-thumb">
                  {itemImage ? (
                    <img src={itemImage} alt={item.name} />
                  ) : (
                    <span>{item.category === 'Drinks' ? '🥤' : '🍱'}</span>
                  )}
                </div>

                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <div className="cart-item-meta">
                    {item.size && <span className="cart-item-size">{item.size}</span>}
                    <span className="cart-item-price">₱{item.price}</span>
                  </div>
                </div>

                <div className="cart-item-controls">
                  <button
                    type="button"
                    onClick={() => updateQty(item.cartKey || item.name, -1)}
                  >
                    −
                  </button>
                  <span>{qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.cartKey || item.name, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="cart-footer">
        <div className="subtotal-row">
          <span className="subtotal-label">Total</span>
          <span className="subtotal-amount">₱{subtotal.toFixed(2)}</span>
        </div>

        <button
          type="button"
          className="proceed-pay-btn"
          disabled={cart.length === 0}
          onClick={processCheckout}
        >
          Proceed to Pay
        </button>
      </div>
    </div>
  );
}