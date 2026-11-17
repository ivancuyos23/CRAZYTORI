import React, { useState, useEffect } from 'react';
import {
  fetchProducts,
  fetchTransactions,
  saveTransactionAPI,
  voidTransactionAPI,
  fetchExpenses,
  saveExpenseAPI,
  deleteExpenseAPI,
  loginAdmin
} from './services/api';

import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import { ToastContainer, showToast } from './components/layout/UIFeedback';
import POSCatalog from './components/cashier/POSCatalog';
import CartSidebar from './components/cashier/CartSidebar';
import TransactionsView from './components/cashier/TransactionsView';
import InventoryView from './components/admin/InventoryView';
import AdminDSRView from './components/admin/AdminDSRView';
import AdminExpensesView from './components/admin/AdminExpensesView';
import AdminMenuView from './components/admin/AdminMenuView';
import AdminSettingsView from './components/admin/AdminSettingsView';
import './App.css';

const DEFAULT_PERMISSIONS = {
  canVoidTransactions: false,
  canFilterTransactionDates: false,
  canViewDSR: false,
  canLogExpenses: false,
  canDeleteExpenses: false,
  canManageMenu: false
};

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [role, setRole] = useState(() => localStorage.getItem('crazy_tori_role') || 'Cashier');
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('crazy_tori_active_tab') || 'pos';
    return savedTab === 'waiting' ? 'transactions' : savedTab;
  });
  const [category, setCategory] = useState(() => localStorage.getItem('crazy_tori_category') || 'Food');
  const [searchQuery, setSearchQuery] = useState('');

  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [cart, setItemsCart] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [servingNo, setServingNo] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_serving_no');
    return saved ? Number(saved) : 1;
  });

  const [waitingOrders, setWaitingOrders] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_waiting_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(todayStr.slice(0, 7));

  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_permissions');
    return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
  });

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    localStorage.setItem('crazy_tori_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_category', category);
  }, [category]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_serving_no', String(servingNo));
  }, [servingNo]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_waiting_orders', JSON.stringify(waitingOrders));
  }, [waitingOrders]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_permissions', JSON.stringify(permissions));
  }, [permissions]);

  const loadData = async () => {
    try {
      const [prods, txs, exps] = await Promise.all([
        fetchProducts(),
        fetchTransactions(),
        fetchExpenses()
      ]);
      setProducts(prods || []);
      setTransactions(txs || []);
      setExpenses(exps || []);
    } catch (err) {
      console.error('Error loading POS data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = (product, size = null, price = product.price) => {
    const cartKey = `${product.name}-${size || 'regular'}`;
    setItemsCart(prev => {
      const existingIndex = prev.findIndex(
        item => (item.cartKey || `${item.name}-${item.size || 'regular'}`) === cartKey
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].qty || updated[existingIndex].quantity || 1;
        updated[existingIndex] = {
          ...updated[existingIndex],
          cartKey,
          qty: currentQty + 1,
          quantity: currentQty + 1
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: product.id || Date.now(),
          cartKey,
          name: product.name,
          category: product.category,
          size: size || null,
          price: Number(price),
          qty: 1,
          quantity: 1,
          image: product.image || null
        }
      ];
    });
    showToast(`Added ${product.name}${size ? ` (${size})` : ''}`, 'info');
  };

  const updateQty = (keyOrIndex, delta) => {
    setItemsCart(prev => {
      const updated = [...prev];
      const idx =
        typeof keyOrIndex === 'number'
          ? keyOrIndex
          : updated.findIndex(
              item =>
                item.cartKey === keyOrIndex ||
                item.name === keyOrIndex ||
                `${item.name}-${item.size || 'regular'}` === keyOrIndex
            );

      if (idx === -1) return prev;

      const currentQty = updated[idx].qty || updated[idx].quantity || 1;
      const nextQty = currentQty + delta;
      if (nextQty <= 0) {
        updated.splice(idx, 1);
      } else {
        updated[idx] = { ...updated[idx], qty: nextQty, quantity: nextQty };
      }
      return updated;
    });
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || item.quantity || 1),
    0
  );

  const handleCheckout = (paymentDetails) => {
    const pendingOrder = {
      id: 'TXN-' + Date.now(),
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      servingNo: servingNo,
      paymentMethod: paymentDetails?.paymentMethod || 'Cash',
      total: subtotal,
      discount: 0,
      items: cart,
      cashierName: role,
      referenceNo: paymentDetails?.gcashRef || null,
      paymentProof: paymentDetails?.gcashImage || null
    };

    setWaitingOrders(prev => [...prev, pendingOrder]);
    setItemsCart([]);
    setServingNo(prev => (prev >= 16 ? 1 : prev + 1));
    setActiveTab('transactions');
    showToast(`Serving #${servingNo} sent to Pending Orders!`, 'success');
  };

  const handleCompleteWaitingOrder = async (order) => {
    try {
      const completedOrder = {
        ...order,
        date: new Date().toISOString()
      };
      await saveTransactionAPI(completedOrder);
      setWaitingOrders(prev => prev.filter(o => o.id !== order.id));
      setTransactions(prev => [completedOrder, ...prev]);
      await loadData();
      showToast(`Serving #${order.servingNo || '-'} marked Done & Saved!`, 'success');
    } catch (err) {
      showToast('Failed to complete order: ' + err.message, 'error');
    }
  };

  const handleCancelWaitingOrder = (orderId) => {
    if (!window.confirm('Remove this pending order?')) return;
    setWaitingOrders(prev => prev.filter(o => o.id !== orderId));
    showToast('Pending order removed from queue.', 'info');
  };

  const handleVoidTransaction = async (id) => {
    if (!window.confirm('Void and permanently delete this order?')) return;
    await voidTransactionAPI(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    await loadData();
    showToast('Order voided and removed.', 'error');
  };

  const handleSaveExpense = async (expenseData) => {
    await saveExpenseAPI({ ...expenseData, loggedBy: role });
    await loadData();
    showToast('Expense record saved!', 'success');
  };

  const handleDeleteExpense = async (id) => {
    await deleteExpenseAPI(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    await loadData();
    showToast('Expense record deleted.', 'info');
  };

  const handleRoleToggle = () => {
    if (role === 'Admin') {
      setRole('Cashier');
      if (['dsr', 'expenses', 'menu', 'settings'].includes(activeTab)) {
        setActiveTab('pos');
      }
      showToast('Locked to Cashier Mode', 'info');
    } else {
      setPinInput('');
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginAdmin(pinInput);
      if (res && res.success) {
        setRole('Admin');
        setShowPinModal(false);
        setPinInput('');
        showToast('Admin Mode Unlocked!', 'success');
      } else {
        showToast('Incorrect Admin PIN!', 'error');
      }
    } catch {
      showToast('Incorrect Admin PIN!', 'error');
    }
  };

  return (
    <div className="tablet-container">
      <ToastContainer />
      <Header role={role} onRoleToggle={handleRoleToggle} />

      <div className="workspace">
        {activeTab === 'pos' && (
          <>
            <POSCatalog
              products={products}
              category={category}
              setCategory={setCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              addToCart={addToCart}
            />
            <CartSidebar
              cart={cart}
              subtotal={subtotal}
              servingNo={servingNo}
              setServingNo={setServingNo}
              updateQty={updateQty}
              processCheckout={handleCheckout}
            />
          </>
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            waitingOrders={waitingOrders}
            onCompleteOrder={handleCompleteWaitingOrder}
            onCancelWaiting={handleCancelWaitingOrder}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            role={role}
            permissions={permissions}
            onVoidTransaction={handleVoidTransaction}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            transactions={transactions}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            role={role}
          />
        )}

        {activeTab === 'dsr' && (role === 'Admin' || permissions.canViewDSR) && (
          <AdminDSRView
            transactions={transactions}
            expenses={expenses}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
          />
        )}

        {activeTab === 'expenses' && (role === 'Admin' || permissions.canLogExpenses) && (
          <AdminExpensesView
            expenses={expenses}
            role={role}
            permissions={permissions}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'menu' && (role === 'Admin' || permissions.canManageMenu) && (
          <AdminMenuView products={products} onRefreshProducts={loadData} />
        )}

        {activeTab === 'settings' && role === 'Admin' && (
          <AdminSettingsView
            permissions={permissions}
            setPermissions={setPermissions}
            servingNo={servingNo}
            setServingNo={setServingNo}
            transactions={transactions}
            expenses={expenses}
            products={products}
          />
        )}
      </div>

      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        permissions={permissions}
        waitingCount={waitingOrders.length}
      />

      {showPinModal && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={handlePinSubmit}>
            <h3>🔒 Unlock Admin Mode</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
              Enter 4-digit Admin PIN
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              className="pin-input"
              placeholder="••••"
              autoFocus
            />
            <div className="modal-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowPinModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="submit-btn">
                Unlock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}