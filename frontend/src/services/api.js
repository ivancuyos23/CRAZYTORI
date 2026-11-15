import axios from 'axios';

// Automatically points to your laptop IP when on hotspot, or falls back to phone storage
const getBaseUrl = () => {
  const host = window.location.hostname || 'localhost';
  return `http://${host}:5000/api`;
};

const apiClient = axios.create({ timeout: 1200 });

const getLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage limit reached:', e);
  }
};

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Rice Bowl - Signature', category: 'Food', price: 170, sizes: null, image: '/images/ricebowl.jfif' },
  { id: 2, name: 'Rice Bowl - Orenji', category: 'Food', price: 170, sizes: null, image: '/images/ricebowl.jfif' },
  { id: 3, name: 'Rice Bowl - Sesame', category: 'Food', price: 170, sizes: null, image: '/images/ricebowl.jfif' },
  { id: 4, name: 'Snack Box - Chicken & Fries', category: 'Food', price: 150, sizes: null, image: '/images/snackbox.jfif' },
  { id: 5, name: 'Snack Box - All Chicken', category: 'Food', price: 150, sizes: null, image: '/images/snackbox.jfif' },
  { id: 6, name: 'Snack Box - All Fries', category: 'Food', price: 150, sizes: null, image: '/images/snackbox.jfif' },
  { id: 7, name: 'Spamusubi', category: 'Food', price: 100, sizes: null, image: '/images/spamusubi.jpg' },
  { id: 8, name: 'Takoyaki (octopus)', category: 'Food', price: 100, sizes: null, image: null },
  { id: 9, name: 'Ebiyaki (shrimp)', category: 'Food', price: 100, sizes: null, image: null },
  { id: 10, name: 'Chizuyaki (cheese)', category: 'Food', price: 100, sizes: null, image: null },
  { id: 11, name: 'Katsudon', category: 'Food', price: 170, sizes: null, image: '/images/ricebowl.jfif' },
  { id: 12, name: 'Thai Iced Tea', category: 'Drinks', price: 60, sizes: { '16oz': 60, '22oz': 80 }, image: null },
  { id: 13, name: 'Yellow Lemonade', category: 'Drinks', price: 50, sizes: { '16oz': 50, '22oz': 70 }, image: null },
  { id: 14, name: 'Pink Lemonade', category: 'Drinks', price: 50, sizes: { '16oz': 50, '22oz': 70 }, image: null },
  { id: 15, name: 'Matcha Latte', category: 'Drinks', price: 60, sizes: { '16oz': 60, '22oz': 80 }, image: null },
  { id: 16, name: 'Matcha Cafe', category: 'Drinks', price: 60, sizes: { '16oz': 60, '22oz': 80 }, image: null },
  { id: 17, name: 'Matcha Strawberry', category: 'Drinks', price: 70, sizes: { '16oz': 70, '22oz': 90 }, image: null },
  { id: 18, name: 'HL Ginger Tea', category: 'Drinks', price: 50, sizes: { '8oz': 50, '16oz': 70 }, image: null },
  { id: 19, name: 'Calamansi', category: 'Drinks', price: 40, sizes: { '8oz': 40, '16oz': 60 }, image: null },
  { id: 20, name: 'Coffee', category: 'Drinks', price: 50, sizes: { '8oz': 50, '16oz': 70 }, image: null },
  { id: 21, name: 'Spanish latte', category: 'Drinks', price: 70, sizes: { '8oz': 70, '16oz': 90 }, image: null },
  { id: 22, name: 'Mocha', category: 'Drinks', price: 70, sizes: { '8oz': 70, '16oz': 90 }, image: null },
  { id: 23, name: 'Cafe latte', category: 'Drinks', price: 60, sizes: { '8oz': 60, '16oz': 80 }, image: null },
  { id: 24, name: 'Chocolate', category: 'Drinks', price: 60, sizes: { '8oz': 60, '16oz': 80 }, image: null },
  { id: 25, name: 'Americano', category: 'Drinks', price: 50, sizes: { '8oz': 50, '16oz': 70 }, image: null },
  { id: 26, name: 'Caramel macchiato', category: 'Drinks', price: 75, sizes: { '8oz': 75, '16oz': 95 }, image: null },
  { id: 27, name: 'Thai milk tea', category: 'Drinks', price: 80, sizes: { '22oz': 80 }, image: null },
  { id: 28, name: 'Strawberry milk tea', category: 'Drinks', price: 80, sizes: { '22oz': 80 }, image: null },
  { id: 29, name: 'Water 500ml', category: 'Drinks', price: 30, sizes: null, image: null }
];

const DEFAULT_PERMISSIONS = {
  canVoidTransactions: false,
  canFilterTransactionDates: false,
  canViewDSR: false,
  canViewUsage: false,
  canLogExpenses: false,
  canDeleteExpenses: false,
  canManageMenu: false
};

// 1. Admin PIN Authentication & Update (Works Offline on Phone)
export const loginAdmin = async (pin) => {
  try {
    const res = await apiClient.post(`${getBaseUrl()}/login`, { pin });
    localStorage.setItem('crazy_tori_admin_pin', pin);
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 401) throw new Error('Invalid PIN');
    const savedPin = localStorage.getItem('crazy_tori_admin_pin') || '1234';
    if (pin === savedPin) {
      return { success: true, user: { username: 'Admin Owner', role: 'Admin' } };
    }
    throw new Error('Invalid PIN');
  }
};

export const updateAdminPinAPI = async (currentPin, newPin) => {
  try {
    const res = await apiClient.put(`${getBaseUrl()}/users/admin-pin`, { currentPin, newPin });
    localStorage.setItem('crazy_tori_admin_pin', newPin);
    return res.data;
  } catch (err) {
    if (err.response) throw err;
    const savedPin = localStorage.getItem('crazy_tori_admin_pin') || '1234';
    if (currentPin !== savedPin) {
      const error = new Error('Incorrect current PIN.');
      error.response = { data: { error: 'Incorrect current PIN.' } };
      throw error;
    }
    localStorage.setItem('crazy_tori_admin_pin', newPin);
    return { success: true };
  }
};

// 2. Products / Menu Catalog
export const fetchProducts = async () => {
  try {
    const data = (await apiClient.get(`${getBaseUrl()}/products`)).data;
    if (Array.isArray(data) && data.length > 0) {
      setLocal('crazy_tori_products', data);
      return data;
    }
  } catch {
    // Fallback to phone storage
  }
  const localProds = getLocal('crazy_tori_products', null);
  if (!localProds || localProds.length === 0) {
    setLocal('crazy_tori_products', DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }
  return localProds;
};

export const createProductAPI = async (productData) => {
  const current = getLocal('crazy_tori_products', DEFAULT_PRODUCTS);
  const newProd = { ...productData, id: Date.now() };
  setLocal('crazy_tori_products', [...current, newProd]);
  try {
    return (await apiClient.post(`${getBaseUrl()}/products`, productData)).data;
  } catch {
    return newProd;
  }
};

export const updateProductAPI = async (id, productData) => {
  const current = getLocal('crazy_tori_products', DEFAULT_PRODUCTS);
  const updated = current.map(p => (p.id === id ? { ...p, ...productData, id } : p));
  setLocal('crazy_tori_products', updated);
  try {
    return (await apiClient.put(`${getBaseUrl()}/products/${id}`, productData)).data;
  } catch {
    return { id, ...productData };
  }
};

export const deleteProductAPI = async (id) => {
  const current = getLocal('crazy_tori_products', DEFAULT_PRODUCTS);
  setLocal('crazy_tori_products', current.filter(p => p.id !== id));
  try {
    return (await apiClient.delete(`${getBaseUrl()}/products/${id}`)).data;
  } catch {
    return { success: true };
  }
};

// 3. Transactions / Orders
export const fetchTransactions = async () => {
  try {
    const data = (await apiClient.get(`${getBaseUrl()}/transactions`)).data;
    setLocal('crazy_tori_transactions', data);
    return data;
  } catch {
    return getLocal('crazy_tori_transactions', []);
  }
};

export const saveTransactionAPI = async (txData) => {
  const current = getLocal('crazy_tori_transactions', []);
  setLocal('crazy_tori_transactions', [txData, ...current.filter(t => t.id !== txData.id)]);
  try {
    return (await apiClient.post(`${getBaseUrl()}/transactions`, txData)).data;
  } catch {
    return txData;
  }
};

export const voidTransactionAPI = async (id) => {
  const current = getLocal('crazy_tori_transactions', []);
  setLocal('crazy_tori_transactions', current.filter(t => t.id !== id));
  try {
    return (await apiClient.delete(`${getBaseUrl()}/transactions/${id}`)).data;
  } catch {
    return { success: true };
  }
};

// 4. Expenses
export const fetchExpenses = async () => {
  try {
    const data = (await apiClient.get(`${getBaseUrl()}/expenses`)).data;
    setLocal('crazy_tori_expenses', data);
    return data;
  } catch {
    return getLocal('crazy_tori_expenses', []);
  }
};

export const saveExpenseAPI = async (expData) => {
  const current = getLocal('crazy_tori_expenses', []);
  setLocal('crazy_tori_expenses', [expData, ...current.filter(e => e.id !== expData.id)]);
  try {
    return (await apiClient.post(`${getBaseUrl()}/expenses`, expData)).data;
  } catch {
    return expData;
  }
};

export const deleteExpenseAPI = async (id) => {
  const current = getLocal('crazy_tori_expenses', []);
  setLocal('crazy_tori_expenses', current.filter(e => e.id !== id));
  try {
    return (await apiClient.delete(`${getBaseUrl()}/expenses/${id}`)).data;
  } catch {
    return { success: true };
  }
};

// 5. Persistent Cashier Permissions
export const fetchPermissionsAPI = async () => {
  try {
    const data = (await apiClient.get(`${getBaseUrl()}/settings/permissions`)).data;
    const merged = { ...DEFAULT_PERMISSIONS, ...data };
    setLocal('crazy_tori_permissions', merged);
    return merged;
  } catch {
    return getLocal('crazy_tori_permissions', DEFAULT_PERMISSIONS);
  }
};

export const savePermissionsAPI = async (permissionsObj) => {
  setLocal('crazy_tori_permissions', permissionsObj);
  try {
    return (await apiClient.put(`${getBaseUrl()}/settings/permissions`, permissionsObj)).data;
  } catch {
    return { success: true, permissions: permissionsObj };
  }
};