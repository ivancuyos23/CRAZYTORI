import axios from 'axios';

// Automatically uses 'localhost' on your laptop, OR your laptop's Wi-Fi IP when opened on your phone!
const currentHost = window.location.hostname || 'localhost';
const getBaseUrl = () =>
  localStorage.getItem('crazy_tori_server_url') || `http://${currentHost}:5000/api`;

const apiClient = axios.create({ timeout: 1500 });

const INITIAL_PRODUCTS = [
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

// Local fallback helpers for standalone Android APK mode
const getLocal = (key, fallback) => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  return JSON.parse(raw);
};
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// 1. Auth & PIN Security
export const loginAdmin = async (pin) => {
  try {
    return (await apiClient.post(`${getBaseUrl()}/login`, { pin })).data;
  } catch {
    const savedPin = localStorage.getItem('crazy_tori_admin_pin') || '1234';
    if (String(pin) === String(savedPin)) {
      return { success: true, user: { username: 'Admin Owner', role: 'Admin' } };
    }
    throw new Error('Invalid PIN');
  }
};

export const updateAdminPinAPI = async (currentPin, newPin) => {
  try {
    return (await apiClient.put(`${getBaseUrl()}/login/pin`, { currentPin, newPin })).data;
  } catch {
    const savedPin = localStorage.getItem('crazy_tori_admin_pin') || '1234';
    if (String(currentPin) !== String(savedPin)) {
      throw { response: { data: { error: 'Current Admin PIN is incorrect' } } };
    }
    localStorage.setItem('crazy_tori_admin_pin', String(newPin));
    return { success: true };
  }
};

// 2. Products / Menu
export const fetchProducts = async () => {
  try {
    const data = (await apiClient.get(`${getBaseUrl()}/products`)).data;
    setLocal('crazy_tori_products', data);
    return data;
  } catch {
    return getLocal('crazy_tori_products', INITIAL_PRODUCTS);
  }
};

export const createProductAPI = async (prod) => {
  try {
    return (await apiClient.post(`${getBaseUrl()}/products`, prod)).data;
  } catch {
    const list = getLocal('crazy_tori_products', INITIAL_PRODUCTS);
    const created = { ...prod, id: Date.now() };
    setLocal('crazy_tori_products', [...list, created]);
    return created;
  }
};

export const updateProductAPI = async (id, prod) => {
  try {
    return (await apiClient.put(`${getBaseUrl()}/products/${id}`, prod)).data;
  } catch {
    const list = getLocal('crazy_tori_products', INITIAL_PRODUCTS);
    setLocal('crazy_tori_products', list.map(p => (p.id === id ? { ...p, ...prod } : p)));
    return { message: 'Updated locally' };
  }
};

export const deleteProductAPI = async (id) => {
  try {
    return (await apiClient.delete(`${getBaseUrl()}/products/${id}`)).data;
  } catch {
    const list = getLocal('crazy_tori_products', INITIAL_PRODUCTS);
    setLocal('crazy_tori_products', list.filter(p => p.id !== id));
    return { message: 'Deleted locally' };
  }
};

// 3. Transactions
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
  try {
    return (await apiClient.post(`${getBaseUrl()}/transactions`, txData)).data;
  } catch {
    const list = getLocal('crazy_tori_transactions', []);
    setLocal('crazy_tori_transactions', [txData, ...list]);
    return txData;
  }
};

export const voidTransactionAPI = async (id) => {
  try {
    return (await apiClient.delete(`${getBaseUrl()}/transactions/${id}`)).data;
  } catch {
    const list = getLocal('crazy_tori_transactions', []);
    setLocal('crazy_tori_transactions', list.filter(t => t.id !== id));
    return { id };
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
  try {
    return (await apiClient.post(`${getBaseUrl()}/expenses`, expData)).data;
  } catch {
    const list = getLocal('crazy_tori_expenses', []);
    setLocal('crazy_tori_expenses', [expData, ...list]);
    return expData;
  }
};

export const deleteExpenseAPI = async (id) => {
  try {
    return (await apiClient.delete(`${getBaseUrl()}/expenses/${id}`)).data;
  } catch {
    const list = getLocal('crazy_tori_expenses', []);
    setLocal('crazy_tori_expenses', list.filter(e => e.id !== id));
    return { id };
  }
};

const DEFAULT_PERMISSIONS = {
  canVoidTransactions: false,
  canFilterTransactionDates: false,
  canViewDSR: false,
  canViewUsage: false,
  canLogExpenses: false,
  canDeleteExpenses: false,
  canManageMenu: false
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