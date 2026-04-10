import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const MonthlySummary = ({ selectedMonth, onMonthChange }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlySummary();
    }
  }, [selectedMonth]);

  const fetchMonthlySummary = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [year, month] = selectedMonth.split('-');
      const response = await axios.get(
        `${API_BASE_URL}/transactions/monthly-summary?year=${year}&month=${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch monthly summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthSelect = (e) => {
    onMonthChange(e.target.value);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
        <p className="text-gray-500">Select a month to view summary</p>
      </div>
    );
  }

  const expenseChange = summary.previousMonthComparison?.expenseChange || 0;
  const isExpenseUp = expenseChange > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-500" />
          <h3 className="text-base font-medium text-gray-900">Monthly Summary</h3>
        </div>
        <input
          type="month"
          value={selectedMonth}
          onChange={handleMonthSelect}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-xs text-gray-500">Income</p>
          <p className="text-lg font-semibold text-green-600">₹{summary.totalIncome?.toLocaleString()}</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-xs text-gray-500">Expenses</p>
          <p className="text-lg font-semibold text-red-600">₹{summary.totalExpense?.toLocaleString()}</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-500">Savings</p>
          <p className={`text-lg font-semibold ${summary.netSavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ₹{summary.netSavings?.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Savings Rate */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Savings Rate</span>
          <span className="font-medium">{summary.savingsRate}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${Math.min(summary.savingsRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Comparison with previous month */}
      {summary.previousMonthComparison && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          {isExpenseUp ? (
            <TrendingUp size={16} className="text-red-500" />
          ) : (
            <TrendingDown size={16} className="text-green-500" />
          )}
          <span className="text-sm text-gray-600">
            Expenses {isExpenseUp ? 'increased' : 'decreased'} by 
            <span className={`font-medium ${isExpenseUp ? 'text-red-600' : 'text-green-600'}`}>
              {' '}₹{Math.abs(expenseChange).toLocaleString()}
            </span>
            {' '}compared to last month
          </span>
        </div>
      )}

      {/* Insight */}
      {summary.insight && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">{summary.insight}</p>
        </div>
      )}
    </div>
  );
};

export default MonthlySummary;