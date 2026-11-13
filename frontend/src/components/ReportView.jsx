import React, { useState, useEffect } from 'react';
import './ReportView.css';
import { fetchTransactions, fetchExpenses } from '../services/api';

export default function ReportView() {
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const txData = await fetchTransactions();
      const expData = await fetchExpenses();
      setTransactions(Array.isArray(txData) ? txData : []);
      setExpenses(Array.isArray(expData) ? expData : []);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Safe filtering with fallback checks
  const dailyTxs = transactions.filter(t => t?.date && t.date.startsWith(selectedDate));
  const dailyExps = expenses.filter(e => e?.date && e.date.startsWith(selectedDate));

  const totalGCash = dailyTxs.filter(t => t.paymentMethod === 'GCash').reduce((sum, t) => sum + Number(t.total || 0), 0);
  const totalCash = dailyTxs.filter(t => t.paymentMethod === 'Cash').reduce((sum, t) => sum + Number(t.total || 0), 0);
  const totalDailyExpenses = dailyExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalDiscounts = dailyTxs.reduce((sum, t) => sum + Number(t.discount || 0), 0);
  const grossSales = totalGCash + totalCash;
  const netRevenue = grossSales - totalDailyExpenses;

  // Monthly stats
  const monthlyTxs = transactions.filter(t => t?.date && t.date.startsWith(selectedMonth));
  const monthlyExps = expenses.filter(e => e?.date && e.date.startsWith(selectedMonth));
  const monthlyRev = monthlyTxs.reduce((sum, t) => sum + Number(t.total || 0), 0);
  const monthlyExpTotal = monthlyExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = monthlyRev - monthlyExpTotal;

  return (
    <div className="report-container">
      <div className="report-header">
        <h2>Daily Sales Report (DSR) & P&L</h2>
        <div className="report-controls">
          <label>
            Date: 
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="date-input"
            />
          </label>
          <label>
            Month: 
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
              className="date-input"
            />
          </label>
          <button className="refresh-btn" onClick={loadReportData}>🔄 Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading financial reports...</div>
      ) : (
        <div className="report-grid">
          {/* Daily Breakdown Card */}
          <div className="report-card primary-card">
            <h3>📅 Daily Breakdown ({selectedDate})</h3>
            <div className="metric-row">
              <span>Total Orders Count:</span>
              <strong>{dailyTxs.length}</strong>
            </div>
            <div className="metric-row">
              <span>Cash on Hand (Cash Sales):</span>
              <strong className="text-cash">₱{totalCash.toFixed(2)}</strong>
            </div>
            <div className="metric-row">
              <span>GCash / Digital Sales:</span>
              <strong className="text-gcash">₱{totalGCash.toFixed(2)}</strong>
            </div>
            <div className="metric-row">
              <span>Gross Sales:</span>
              <strong>₱{grossSales.toFixed(2)}</strong>
            </div>
            <div className="metric-row">
              <span>Total Expenses (Daily):</span>
              <strong className="text-expense">- ₱{totalDailyExpenses.toFixed(2)}</strong>
            </div>
            <div className="metric-row">
              <span>Total Discounts Applied:</span>
              <span className="text-discount">₱{totalDiscounts.toFixed(2)}</span>
            </div>
            <div className="metric-row total-highlight">
              <span>Net Revenue:</span>
              <span className="net-amount">₱{netRevenue.toFixed(2)}</span>
            </div>
          </div>

          {/* Monthly Profit & Loss Card */}
          <div className="report-card secondary-card">
            <h3>📈 Monthly P&L Summary ({selectedMonth})</h3>
            <div className="metric-row">
              <span>Monthly Gross Revenue:</span>
              <strong>₱{monthlyRev.toFixed(2)}</strong>
            </div>
            <div className="metric-row">
              <span>Monthly Total Expenses:</span>
              <strong className="text-expense">- ₱{monthlyExpTotal.toFixed(2)}</strong>
            </div>
            <div className="metric-row total-highlight">
              <span>Net Profit:</span>
              <span className={netProfit >= 0 ? 'net-profit' : 'net-loss'}>
                ₱{netProfit.toFixed(2)} {netProfit >= 0 ? '🟢 (Gaining)' : '🔴 (Losing)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}