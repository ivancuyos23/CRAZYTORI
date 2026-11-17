import React, { useState, useEffect } from 'react';
import './WaitingList.css';

export default function WaitingListView({ waitingOrders = [], onCompleteOrder, onCancelWaiting }) {
  const [now, setNow] = useState(Date.now());

  // Live 1-second timer tick
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (createdAt) => {
    const startMs = new Date(createdAt).getTime();
    const diffSec = Math.max(0, Math.floor((now - startMs) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    const isOverdue = diffSec >= 300; // 5 minutes = 300 seconds
    const label = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return { label, isOverdue };
  };

  return (
    <div className="waiting-page-container">
      <div className="waiting-header">
        <div>
          <h2>⏳ Kitchen Waiting List</h2>
          <p>Orders turn red at 5:00 mins. Click <strong>Done / Served</strong> to move to Orders.</p>
        </div>
        <span className="waiting-count-pill">
          {waitingOrders.length} Pending {waitingOrders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>

      {waitingOrders.length === 0 ? (
        <div className="waiting-empty-state">
          <span>✅</span>
          <h3>No pending orders in queue</h3>
          <p>New orders checked out from the POS Register will appear here automatically.</p>
        </div>
      ) : (
        <div className="waiting-grid">
          {waitingOrders.map(order => {
            const { label, isOverdue } = formatElapsed(order.createdAt || order.date);
            return (
              <div
                key={order.id}
                className={`waiting-card ${isOverdue ? 'overdue-red' : ''}`}
              >
                <div className="waiting-card-top">
                  <div>
                    <span className="waiting-serving-badge">
                      Serving #{order.servingNo || '-'}
                    </span>
                    <div className="waiting-order-id">{order.id}</div>
                  </div>

                  {/* Live Timer beside order — turns RED at 5:00 */}
                  <div className={`waiting-timer-badge ${isOverdue ? 'timer-red' : ''}`}>
                    <span>⏱️</span>
                    <strong>{label}</strong>
                  </div>
                </div>

                <div className="waiting-items-list">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="waiting-item-line">
                      <span className="waiting-qty">{item.qty || 1}x</span>
                      <span className="waiting-name">
                        {item.name} {item.size ? `(${item.size})` : ''}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="waiting-card-footer">
                  <div className="waiting-meta">
                    <span>{order.paymentMethod}</span>
                    <strong>₱{Number(order.total || 0).toFixed(2)}</strong>
                  </div>

                  <div className="waiting-actions">
                    {onCancelWaiting && (
                      <button
                        type="button"
                        className="waiting-cancel-btn"
                        onClick={() => onCancelWaiting(order.id)}
                        title="Remove from queue"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="button"
                      className="waiting-done-btn"
                      onClick={() => onCompleteOrder(order)}
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
  );
}