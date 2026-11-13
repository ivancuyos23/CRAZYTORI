import React from 'react';
import './CartSidebar.css';

import riceBowlImg from '../../assets/images/ricebowl.jfif';
import snackBoxImg from '../../assets/images/snackbox.jfif';
import spamMusubiImg from '../../assets/images/spamusubi.jpg';

export default function CartSidebar({
  cart,
  updateQty,
  subtotal,
  servingNo = 1,
  setServingNo,
  processCheckout
}) {
  const getCartItemImage = (productName) => {
    const name = productName.toLowerCase();
    if (name.includes('rice bowl') || name.includes('katsudon')) return riceBowlImg;
    if (name.includes('snack box')) return snackBoxImg;
    if (name.includes('spamusubi')) return spamMusubiImg;
    return null;
  };

  return (
    <div className="cart-sidebar">
      <div className="cart-header">
        <h3>Current Order</h3>
        <span className="cart-count-badge">
          {cart.reduce((sum, item) => sum + item.qty, 0)} items
        </span>
      </div>

      <div className="cart-items-list">
        {cart.length === 0 ? (
          <div className="empty-cart">
            <span className="empty-cart-icon">🛒</span>
            <p>Your order list is empty</p>
            <span className="empty-subtext">Tap items from the menu to add them</span>
          </div>
        ) : (
          cart.map((item) => {
            const itemImage = getCartItemImage(item.name);
            return (
              <div key={item.cartKey} className="cart-item-row">
                <div className="cart-item-thumb">
                  {itemImage ? (
                    <img src={itemImage} alt={item.name} />
                  ) : (
                    <span>🥤</span>
                  )}
                </div>

                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  {item.size && <span className="cart-item-size">Size: {item.size}</span>}
                  <span className="cart-item-price">₱{item.price}</span>
                </div>

                <div className="cart-item-controls">
                  <button onClick={() => updateQty(item.cartKey, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => updateQty(item.cartKey, 1)}>+</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="cart-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '6px' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>🍽️ Serving Number:</span>
          <select
            value={servingNo}
            onChange={(e) => setServingNo(Number(e.target.value))}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1.5px solid #0f172a',
              background: '#fffbeb',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#0f172a',
              width: 'auto',
              margin: 0,
              cursor: 'pointer'
            }}
          >
            {Array.from({ length: 16 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>#{num}</option>
            ))}
          </select>
        </div>

        <div className="subtotal-row">
          <span>Total Amount:</span>
          <span className="subtotal-amount">₱{subtotal.toFixed(2)}</span>
        </div>

        <button
          className="proceed-pay-btn"
          disabled={cart.length === 0}
          onClick={processCheckout}
        >
          PROCEED TO PAY
        </button>
      </div>
    </div>
  );
}