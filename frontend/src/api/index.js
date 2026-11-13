import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Transactions
export const fetchTransactions = async () => {
  const response = await axios.get(`${API_BASE_URL}/transactions`);
  return response.data;
};

export const saveTransactionAPI = async (transactionData) => {
  const response = await axios.post(`${API_BASE_URL}/transactions`, transactionData);
  return response.data;
};

// Expenses
export const fetchExpenses = async () => {
  const response = await axios.get(`${API_BASE_URL}/expenses`);
  return response.data;
};

export const saveExpenseAPI = async (expenseData) => {
  const response = await axios.post(`${API_BASE_URL}/expenses`, expenseData);
  return response.data;
};