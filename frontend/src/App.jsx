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
  deleteExpenseAPI
} from './services/api';

import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import POSCatalog from './components/cashier/POSCatalog';
import CartSidebar from './components/cashier/CartSidebar';
import PaymentModal from './components/cashier/PaymentModal';
import TransactionsView from './components/cashier/TransactionsView';
import AdminUsageView from './components/admin/AdminUsageView';
import AdminDSRView from './components/admin/AdminDSRView';
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
  const [activeTab, setActiveTab] = useState('pos');
  const [category, setCategory] = useState('Food');
  const [searchQuery, setSearchQuery] = useState('');

  // Database States
  const [products, setProducts] = useState([]);
  const [cart, setItemsCart] = useState([]);
  const [servingNo, setServingNo] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Role & Modals
  const [role, setRole] = useState('Cashier');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Cashier Permissions (Configured by Admin, saved in localStorage)
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('crazy_tori_cashier_permissions');
    return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
  });

  useEffect(() => {
    localStorage.setItem('crazy_tori_cashier_permissions', JSON.stringify(permissions));
  }, [permissions]);

  // Admin Report Date Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, txRes, expRes] = await Promise.all([
        fetchProducts(),
        fetchTransactions(),
        fetchExpenses()
      ]);
      setProducts(prodRes);
      setTransactions(txRes);
      setExpenses(expRes);
    } catch (err) {
      console.error('Error connecting to backend:', err);
    }
  };

  const handleRoleToggle = () => {
    if (role === 'Admin') {
      setRole('Cashier');
      // If locking back to Cashier on a restricted tab, return to POS
      if (
        activeTab === 'settings' ||
        (activeTab === 'dsr' && !permissions.canViewDSR) ||
        (activeTab === 'expenses' && !permissions.canLogExpenses) ||
        (activeTab === 'menu' && !permissions.canManageMenu)
      ) {
        setActiveTab('pos');
      }
    } else {
      setPinInput('');
      setShowPinModal(true);
    }
  };

  const handlePinLogin = async () => {
    try {
      const data = await loginAdmin(pinInput);
      if (data.success && data.user.role === 'Admin') {
        setRole('Admin');
        setShowPinModal(false);
        setPinInput('');
      } else {
        alert('Please enter the Admin PIN (1234).');
      }
    } catch {
      alert('Invalid PIN! Default Admin PIN is 1234.');
    }
  };

  const addToCart = (product, size, price) => {
    const cartKey = size ? `${product.name}-${size}` : product.name;
    const existing = cart.find(item => item.cartKey === cartKey);
    if (existing) {
      setItemsCart(cart.map(i => i.cartKey === cartKey ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setItemsCart([...cart, { cartKey, name: product.name, size, price, qty: 1, image: product.image }]);
    }
  };

  const updateQty = (cartKey, delta) => {
    setItemsCart(cart.map(item => {
      if (item.cartKey === cartKey) {
        const nextQty = item.qty + delta;
        return nextQty > 0 ? { ...item, qty: nextQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = async (paymentDetails) => {
    const newTx = {
      id: 'TXN-' + Date.now(),
      date: new Date().toISOString(),
      servingNo: servingNo,
      paymentMethod: paymentDetails.paymentMethod,
      total: subtotal,
      discount: 0,
      items: cart,
      cashierName: role,
      referenceNo: paymentDetails.gcashRef || null
    };

    await saveTransactionAPI(newTx);
    setItemsCart([]);
    setServingNo(prev => (prev % 16) + 1);
    setShowPaymentModal(false);
    loadData();
  };

  return (
    <div className="tablet-container">
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
            onVoidTransaction={async (id) => {
              if (window.confirm('Void and delete this transaction?')) {
                await voidTransactionAPI(id);
                loadData();
              }
            }}
          />
        )}

        {(role === 'Admin' || permissions.canViewDSR) && activeTab === 'dsr'  && (
          <AdminDSRView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            transactions={transactions}
            expenses={expenses}
          />
        )}

        {(role === 'Admin' || permissions.canViewUsage) && activeTab === 'usage' && (
        <AdminUsageView
          transactions={transactions}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          role={role}
        />
      )}

        {(role === 'Admin' || permissions.canLogExpenses) && activeTab === 'expenses' && (
          <AdminExpensesView
            expenses={expenses}
            role={role}
            permissions={permissions}
            onSaveExpense={async (exp) => { await saveExpenseAPI({ ...exp, loggedBy: role }); loadData(); }}
            onDeleteExpense={async (id) => { await deleteExpenseAPI(id); loadData(); }}
          />
        )}

        {(role === 'Admin' || permissions.canManageMenu) && activeTab === 'menu' && (
          <AdminMenuView
            products={products}
            onAddProduct={async (prod) => { await createProductAPI(prod); loadData(); }}
            onUpdateProduct={async (id, prod) => { await updateProductAPI(id, prod); loadData(); }}
            onDeleteProduct={async (id) => { await deleteProductAPI(id); loadData(); }}
          />
        )}

        {role === 'Admin' && activeTab === 'settings' && (
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
      />

      {showPaymentModal && (
        <PaymentModal
          subtotal={subtotal}
          cart={cart}
          onClose={() => setShowPaymentModal(false)}
          onComplete={handleCheckout}
        />
      )}

      {showPinModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Unlock Admin Mode</h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#64748b' }}>
              Enter 4-digit Admin PIN (Default: <b>1234</b>)
            </p>
            <input
              type="password"
              maxLength="4"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePinLogin()}
              placeholder="••••"
              className="pin-input"
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={() => setShowPinModal(false)} className="cancel-btn">Cancel</button>
              <button onClick={handlePinLogin} className="submit-btn">Unlock</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}