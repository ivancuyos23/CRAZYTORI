import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Auth & PIN Security
export const loginAdmin = async (pin) => (await axios.post(`${API_BASE_URL}/login`, { pin })).data;
export const updateAdminPinAPI = async (currentPin, newPin) =>
  (await axios.put(`${API_BASE_URL}/login/pin`, { currentPin, newPin })).data;

// Products / Menu
export const fetchProducts = async () => (await axios.get(`${API_BASE_URL}/products`)).data;
export const createProductAPI = async (data) => (await axios.post(`${API_BASE_URL}/products`, data)).data;
export const updateProductAPI = async (id, data) => (await axios.put(`${API_BASE_URL}/products/${id}`, data)).data;
export const deleteProductAPI = async (id) => (await axios.delete(`${API_BASE_URL}/products/${id}`)).data;

// Transactions
export const fetchTransactions = async () => (await axios.get(`${API_BASE_URL}/transactions`)).data;
export const saveTransactionAPI = async (txData) => (await axios.post(`${API_BASE_URL}/transactions`, txData)).data;
export const voidTransactionAPI = async (id) => (await axios.delete(`${API_BASE_URL}/transactions/${id}`)).data;

// Expenses
export const fetchExpenses = async () => (await axios.get(`${API_BASE_URL}/expenses`)).data;
export const saveExpenseAPI = async (expData) => (await axios.post(`${API_BASE_URL}/expenses`, expData)).data;
export const deleteExpenseAPI = async (id) => (await axios.delete(`${API_BASE_URL}/expenses/${id}`)).data;