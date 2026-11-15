import React, { useState, useEffect } from 'react';
import {
  loginAdmin,
  fetchProducts,
  createProductAPI,
  updateProductAPI,
  deleteProductAPI,
  fetchTransactions,
  saveTransactionAPI,
  voidTransactionAPI,
  fetchExpenses,
  saveExpenseAPI,
  deleteExpenseAPI,
  fetchPermissionsAPI,
  savePermissionsAPI
} from './services/api';

import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import POSCatalog from './components/cashier/POSCatalog';
import CartSidebar from './components/cashier/CartSidebar';
import PaymentModal from './components/cashier/PaymentModal';
import TransactionsView from './components/cashier/TransactionsView';

import AdminDSRView from './components/admin/AdminDSRView';
import AdminUsageView from './components/admin/AdminUsageView';
import AdminExpensesView from './components/admin/AdminExpensesView';
import AdminMenuView from './components/admin/AdminMenuView';
import AdminSettingsView from './components/admin/AdminSettingsView';

import './App.css';

const DEFAULT_PERMISSIONS = {
  canVoidTransactions: false,
  canFilterTransactionDates: false,
  canViewDSR: false,
  canViewUsage: false,
  canLogExpenses: false,
  canDeleteExpenses: false,
  canManageMenu: false
};

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7);

  // 1. Persistent Role, Active Tab & Category across refreshes
  const [role, setRole] = useState(() => {
    return localStorage.getItem('crazy_tori_role') || 'Cashier';
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('crazy_tori_active_tab') || 'pos';
  });

  const [category, setCategory] = useState(() => {
    return localStorage.getItem('crazy_tori_category') || 'Food';
  });

  // 2. Persistent Cashier Access Permissions (loaded immediately, synced with SQLite)
  const [permissions, setPermissionsState] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_permissions');
    return saved ? { ...DEFAULT_PERMISSIONS, ...JSON.parse(saved) } : DEFAULT_PERMISSIONS;
  });

  // 3. Persistent Cart, Serving No & Report Dates across refreshes
  const [cart, setItemsCart] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [servingNo, setServingNo] = useState(() => {
    return Number(localStorage.getItem('crazy_tori_serving_no')) || 1;
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return localStorage.getItem('crazy_tori_selected_date') || todayStr;
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem('crazy_tori_selected_month') || currentMonthStr;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Save UI states automatically on change
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
    localStorage.setItem('crazy_tori_selected_date', selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    localStorage.setItem('crazy_tori_selected_month', selectedMonth);
  }, [selectedMonth]);

  // Load Database Data & Persistent Permissions on Startup
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodData, txData, expData, permData] = await Promise.all([
        fetchProducts(),
        fetchTransactions(),
        fetchExpenses(),
        fetchPermissionsAPI()
      ]);
      setProducts(prodData || []);
      setTransactions(txData || []);
      setExpenses(expData || []);
      if (permData) setPermissionsState(permData);
    } catch (err) {
      console.error('Error loading store data:', err);
    }
  };

  // Wrapper that updates permissions in state, localStorage, and SQLite DB
  const handleUpdatePermissions = async (updater) => {
    const nextPerms = typeof updater === 'function' ? updater(permissions) : updater;
    setPermissionsState(nextPerms);
    await savePermissionsAPI(nextPerms);
  };

  // Guard activeTab only if Cashier loses access to a restricted tab
  useEffect(() => {
    if (role === 'Admin') return;
    const allowedForCashier = {
      pos: true,
      transactions: true,
      dsr: !!permissions.canViewDSR,
      usage: !!permissions.canViewUsage,
      expenses: !!permissions.canLogExpenses,
      menu: !!permissions.canManageMenu,
      settings: false
    };
    if (!allowedForCashier[activeTab]) {
      setActiveTab('pos');
    }
  }, [role, permissions, activeTab]);

  // Role Switching & Admin PIN Unlock
  const handleRoleButtonClick = () => {
    if (role === 'Admin') {
      setRole('Cashier');
    } else {
      setPinInput('');
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginAdmin(pinInput);
      setRole('Admin');
      setShowPinModal(false);
      setPinInput('');
    } catch {
      alert('Incorrect Admin PIN.');
    }
  };

  // Cart & Checkout Operations
  const addToCart = (product, size, price) => {
    const cartKey = size ? `${product.name}-${size}` : product.name;
    const existing = cart.find(item => item.cartKey === cartKey);
    if (existing) {
      setItemsCart(cart.map(item => (item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      setItemsCart([
        ...cart,
        {
          cartKey,
          name: product.name,
          category: product.category,
          image: product.image,
          size,
          price: Number(price),
          qty: 1
        }
      ]);
    }
  };

  const updateQty = (cartKey, delta) => {
    setItemsCart(
      cart
        .map(item => {
          if (item.cartKey === cartKey) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

const handleCompletePayment = async (paymentDetails) => {
    const newTx = {
      id: 'TXN-' + Date.now(),
      date: new Date().toISOString(),
      servingNo,
      paymentMethod: paymentDetails.paymentMethod,
      total: subtotal,
      discount: 0,
      items: cart,
      cashierName: role,
      referenceNo: paymentDetails.gcashRef || null,
      paymentProof: paymentDetails.gcashImage || null
    };

    await saveTransactionAPI(newTx);
    setTransactions(prev => [newTx, ...prev]);
    setItemsCart([]);
    setServingNo(prev => (prev >= 16 ? 1 : prev + 1));
    setShowPaymentModal(false);
  };

  const handleVoidTransaction = async (id) => {
    if (!window.confirm('Void and delete this order?')) return;
    await voidTransactionAPI(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Expense Operations
  const handleSaveExpense = async (expData) => {
    await saveExpenseAPI(expData);
    const updated = await fetchExpenses();
    setExpenses(updated);
  };

  const handleDeleteExpense = async (id) => {
    await deleteExpenseAPI(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Menu Operations
  const handleAddProduct = async (prodData) => {
    await createProductAPI(prodData);
    setProducts(await fetchProducts());
  };

  const handleUpdateProduct = async (id, prodData) => {
    await updateProductAPI(id, prodData);
    setProducts(await fetchProducts());
  };

  const handleDeleteProduct = async (id) => {
    await deleteProductAPI(id);
    setProducts(await fetchProducts());
  };

  return (
    <div className="tablet-container">
      <Header role={role} onRoleClick={handleRoleButtonClick} />

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
              updateQty={updateQty}
              subtotal={subtotal}
              servingNo={servingNo}
              setServingNo={setServingNo}
              processCheckout={() => cart.length > 0 && setShowPaymentModal(true)}
            />
          </>
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            role={role}
            permissions={permissions}
            onVoidTransaction={handleVoidTransaction}
          />
        )}

        {activeTab === 'dsr' && (
          <AdminDSRView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            transactions={transactions}
            expenses={expenses}
          />
        )}

        {activeTab === 'usage' && (
          <AdminUsageView
            transactions={transactions}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            role={role}
          />
        )}

        {activeTab === 'expenses' && (
          <AdminExpensesView
            expenses={expenses}
            role={role}
            permissions={permissions}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'menu' && (
          <AdminMenuView
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'settings' && role === 'Admin' && (
          <AdminSettingsView
            permissions={permissions}
            setPermissions={handleUpdatePermissions}
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
      />

      {showPaymentModal && (
        <PaymentModal
          subtotal={subtotal}
          cart={cart}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handleCompletePayment}
        />
      )}

      {showPinModal && (
        <div className="modal-backdrop" onClick={() => setShowPinModal(false)}>
          <form
            className="modal-card"
            onClick={e => e.stopPropagation()}
            onSubmit={handlePinSubmit}
          >
            <h3>Admin PIN Required</h3>
            <input
              type="password"
              maxLength="4"
              placeholder="••••"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              className="pin-input"
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