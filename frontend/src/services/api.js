import axios from 'axios';

const currentHost = window.location.hostname || 'localhost';
const getBaseUrl = () =>
  localStorage.getItem('crazy_tori_server_url') || `http://${currentHost}:5000/api`;

const apiClient = axios.create({ timeout: 1500 });

const KEYS = {
  PRODUCTS: 'crazy_tori_products',
  TRANSACTIONS: 'crazy_tori_transactions',
  EXPENSES: 'crazy_tori_expenses',
  ADMIN_PIN: 'crazy_tori_admin_pin'
};

const DEFAULT_SNACKBOX_FLAVORS = [
  'BBQ',
  'Sour Cream',
  'Rancho Cheddar',
  'Cheese',
  'Honey Butter',
  'Sriracha',
  'Garlic Parmesan'
];

const DEFAULT_PRODUCTS = [
  // Rice Bowls (Original / Spicy enabled)
  { id: 1, name: 'Rice Bowl - Signature', category: 'Food', price: 170, sizes: null, image: 'ricebowl', hasSpice: true, flavors: null },
  { id: 2, name: 'Rice Bowl - Orenji', category: 'Food', price: 170, sizes: null, image: 'ricebowl', hasSpice: true, flavors: null },
  { id: 3, name: 'Rice Bowl - Sesame', category: 'Food', price: 170, sizes: null, image: 'ricebowl', hasSpice: true, flavors: null },
  // Snack Boxes (Original / Spicy + 7 Flavors enabled)
  { id: 4, name: 'Snack Box - Chicken & Fries', category: 'Food', price: 150, sizes: null, image: 'snackbox', hasSpice: true, flavors: DEFAULT_SNACKBOX_FLAVORS },
  { id: 5, name: 'Snack Box - All Chicken', category: 'Food', price: 150, sizes: null, image: 'snackbox', hasSpice: true, flavors: DEFAULT_SNACKBOX_FLAVORS },
  { id: 6, name: 'Snack Box - All Fries', category: 'Food', price: 150, sizes: null, image: 'snackbox', hasSpice: true, flavors: DEFAULT_SNACKBOX_FLAVORS },
  // Snacks & Bites
  { id: 7, name: 'Spamusubi', category: 'Food', price: 100, sizes: null, image: 'spamusubi', hasSpice: false, flavors: null },
  { id: 8, name: 'Takoyaki (octopus)', category: 'Food', price: 100, sizes: null, image: null, hasSpice: false, flavors: null },
  { id: 9, name: 'Ebiyaki (shrimp)', category: 'Food', price: 100, sizes: null, image: null, hasSpice: false, flavors: null },
  { id: 10, name: 'Chizuyaki (cheese)', category: 'Food', price: 100, sizes: null, image: null, hasSpice: false, flavors: null },
  { id: 11, name: 'Katsudon', category: 'Food', price: 170, sizes: null, image: 'ricebowl', hasSpice: false, flavors: null },
  // Drinks (Clear Cup Oz Sizes)
  { id: 12, name: 'Water 500ml', category: 'Drinks', price: 30, sizes: null, image: null },
  { id: 13, name: 'Iced Tea', category: 'Drinks', price: 35, sizes: { '8oz': 35, '16oz': 55, '22oz': 70 }, image: null },
  { id: 14, name: 'Lemonade', category: 'Drinks', price: 35, sizes: { '8oz': 35, '16oz': 55, '22oz': 70 }, image: null },
  { id: 15, name: 'Blue Lemonade', category: 'Drinks', price: 40, sizes: { '8oz': 40, '16oz': 60, '22oz': 75 }, image: null },
  { id: 16, name: 'Cucumber Lemonade', category: 'Drinks', price: 40, sizes: { '8oz': 40, '16oz': 60, '22oz': 75 }, image: null },
  { id: 17, name: 'Red Iced Tea', category: 'Drinks', price: 40, sizes: { '8oz': 40, '16oz': 60, '22oz': 75 }, image: null }
];

const getLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const setLocal = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// 1. Products (Menu Catalog)
export const fetchProducts = async () => {
  try {
    const res = await apiClient.get(`${getBaseUrl()}/products`);
    if (Array.isArray(res.data) && res.data.length > 0) {
      setLocal(KEYS.PRODUCTS, res.data);
      return res.data;
    }
    return getLocal(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  } catch {
    return getLocal(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  }
};

export const addProductAPI = async (product) => {
  try {
    const res = await apiClient.post(`${getBaseUrl()}/products`, product);
    const current = getLocal(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    setLocal(KEYS.PRODUCTS, [...current, res.data]);
    return res.data;
  } catch {
    const current = getLocal(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
    const newProd = { ...product, id: Date.now() };
    setLocal(KEYS.PRODUCTS, [...current, newProd]);
    return newProd;
  }
};

// Alias so both AdminMenuView and AdminMenuForm work seamlessly
export const createProductAPI = addProductAPI;

export const updateProductAPI = async (id, product) => {
  try {
    await apiClient.put(`${getBaseUrl()}/products/${id}`, product);
  } catch {
    // Offline fallback
  }
  const current = getLocal(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  const updated = current.map(p => (String(p.id) === String(id) ? { ...p, ...product, id: p.id } : p));
  setLocal(KEYS.PRODUCTS, updated);
  return { id, ...product };
};

export const deleteProductAPI = async (id) => {
  try {
    await apiClient.delete(`${getBaseUrl()}/products/${id}`);
  } catch {
    // Offline fallback
  }
  const current = getLocal(KEYS.PRODUCTS, DEFAULT_PRODUCTS);
  setLocal(KEYS.PRODUCTS, current.filter(p => String(p.id) !== String(id)));
  return { success: true };
};

// 2. Transactions (Completed Orders)
export const fetchTransactions = async () => {
  try {
    const res = await apiClient.get(`${getBaseUrl()}/transactions`);
    if (Array.isArray(res.data)) {
      const localTxs = getLocal(KEYS.TRANSACTIONS, []);
      // Preserve local base64 paymentProof if backend didn't store it
      const merged = res.data.map(serverTx => {
        const match = localTxs.find(lt => lt.id === serverTx.id);
        return {
          ...serverTx,
          paymentProof: serverTx.paymentProof || match?.paymentProof || null
        };
      });
      setLocal(KEYS.TRANSACTIONS, merged);
      return merged;
    }
    return getLocal(KEYS.TRANSACTIONS, []);
  } catch {
    return getLocal(KEYS.TRANSACTIONS, []);
  }
};

export const saveTransactionAPI = async (txData) => {
  const current = getLocal(KEYS.TRANSACTIONS, []);
  setLocal(KEYS.TRANSACTIONS, [txData, ...current.filter(t => t.id !== txData.id)]);
  try {
    await apiClient.post(`${getBaseUrl()}/transactions`, txData);
  } catch {
    // Saved locally in APK storage
  }
  return txData;
};

export const voidTransactionAPI = async (id) => {
  const current = getLocal(KEYS.TRANSACTIONS, []);
  setLocal(KEYS.TRANSACTIONS, current.filter(t => t.id !== id));
  try {
    await apiClient.delete(`${getBaseUrl()}/transactions/${id}`);
  } catch {
    // Removed locally
  }
  return { success: true };
};

// 3. Expenses (3-Tier Store Expenses)
export const fetchExpenses = async () => {
  try {
    const res = await apiClient.get(`${getBaseUrl()}/expenses`);
    if (Array.isArray(res.data)) {
      setLocal(KEYS.EXPENSES, res.data);
      return res.data;
    }
    return getLocal(KEYS.EXPENSES, []);
  } catch {
    return getLocal(KEYS.EXPENSES, []);
  }
};

export const saveExpenseAPI = async (expenseData) => {
  const newExp = { ...expenseData, id: expenseData.id || 'EXP-' + Date.now() };
  const current = getLocal(KEYS.EXPENSES, []);
  setLocal(KEYS.EXPENSES, [newExp, ...current.filter(e => e.id !== newExp.id)]);
  try {
    await apiClient.post(`${getBaseUrl()}/expenses`, newExp);
  } catch {
    // Saved locally
  }
  return newExp;
};

export const deleteExpenseAPI = async (id) => {
  const current = getLocal(KEYS.EXPENSES, []);
  setLocal(KEYS.EXPENSES, current.filter(e => e.id !== id));
  try {
    await apiClient.delete(`${getBaseUrl()}/expenses/${id}`);
  } catch {
    // Deleted locally
  }
  return { success: true };
};

// 4. Admin PIN Authentication & Update
export const loginAdmin = async (pin) => {
  const savedPin = localStorage.getItem(KEYS.ADMIN_PIN) || '1234';
  try {
    const res = await apiClient.post(`${getBaseUrl()}/login`, { pin });
    return res.data;
  } catch {
    if (String(pin) === String(savedPin)) {
      return { success: true, user: { username: 'Admin Owner', role: 'Admin' } };
    }
    throw new Error('Invalid PIN');
  }
};

export const updateAdminPinAPI = async (currentPin, newPin) => {
  const savedPin = localStorage.getItem(KEYS.ADMIN_PIN) || '1234';
  try {
    const res = await apiClient.put(`${getBaseUrl()}/users/admin-pin`, { currentPin, newPin });
    localStorage.setItem(KEYS.ADMIN_PIN, String(newPin));
    return res.data;
  } catch {
    if (String(currentPin) !== String(savedPin)) {
      const err = new Error('Incorrect current PIN.');
      err.response = { data: { error: 'Incorrect current PIN.' } };
      throw err;
    }
    localStorage.setItem(KEYS.ADMIN_PIN, String(newPin));
    return { success: true };
  }
};