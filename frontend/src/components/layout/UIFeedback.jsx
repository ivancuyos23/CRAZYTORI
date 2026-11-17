import React, { useState, useEffect } from 'react';

// Global helper so any component can trigger a toast without extra props
export function showToast(message, type = 'success') {
  window.dispatchEvent(
    new CustomEvent('crazy-tori-toast', {
      detail: { id: Date.now() + Math.random(), message, type }
    })
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const newToast = e.detail;
      setToasts(prev => [...prev.slice(-3), newToast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== newToast.id));
      }, 2800);
    };

    window.addEventListener('crazy-tori-toast', handleToast);
    return () => window.removeEventListener('crazy-tori-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="tori-toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`tori-toast-card toast-${t.type || 'success'}`}>
          <span className="tori-toast-icon">
            {t.type === 'error' ? '⚠️' : t.type === 'info' ? '🔔' : '✅'}
          </span>
          <span className="tori-toast-msg">{t.message}</span>
          <button
            type="button"
            className="tori-toast-close"
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export function PaginationBar({
  currentPage = 1,
  totalItems = 0,
  pageSize = 8,
  onPageChange
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, safePage * pageSize);

  // Build visible page numbers (up to 5 buttons)
  const pages = [];
  let startP = Math.max(1, safePage - 2);
  let endP = Math.min(totalPages, startP + 4);
  if (endP - startP < 4) startP = Math.max(1, endP - 4);
  for (let p = startP; p <= endP; p++) pages.push(p);

  return (
    <div className="tori-pagination-bar">
      <span className="tori-page-info">
        Showing <strong>{startIdx}–{endIdx}</strong> of <strong>{totalItems}</strong>
      </span>

      <div className="tori-page-controls">
        <button
          type="button"
          className="tori-page-btn nav-arrow"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          ◀ Prev
        </button>

        {pages.map(p => (
          <button
            key={p}
            type="button"
            className={p === safePage ? 'tori-page-btn active' : 'tori-page-btn'}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className="tori-page-btn nav-arrow"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}