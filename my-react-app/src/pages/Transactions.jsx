import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Components
import IncomeExpenseChart from '../components/Transactions/IncomeExpenseChart';
import TransactionStats from '../components/Transactions/TransactionStats';
import TransactionFilters from '../components/Transactions/TransactionFilters';
import TransactionList from '../components/Transactions/TransactionList';
import CategoryPieChart from '../components/Transactions/CategoryPieChart';
import TopSpendingCategories from '../components/Transactions/TopSpendingCategories';
import MonthlySummary from '../components/Transactions/MonthlySummary';
import TransactionDetailsModal from '../components/Transactions/TransactionDetailsModal';
import EditTransactionModal from '../components/Transactions/EditTransactionModal';
import AddTransactionModal from '../components/Dashboard/AddTransactionModal';
import Layout from '../components/Layout/Layout'; // Import the Layout component

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Helper function for category icons
const getCategoryIcon = (categoryName) => {
  const icons = {
    'Food & Dining': '🍔',
    'Coffee Shops': '☕',
    'Restaurants': '🍽️',
    'Shopping': '🛍️',
    'Transportation': '🚗',
    'Entertainment': '🎬',
    'Bills & Utilities': '💡',
    'Healthcare': '🏥',
    'Education': '📚',
    'Salary': '💰',
    'Freelance': '💼',
    'Rent': '🏠',
    'Groceries': '🛒',
    'Investment': '📈',
    'Other': '📦'
  };
  return icons[categoryName] || '💳';
};

const Transactions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: ''
  });

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/transactions/my-transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let transactionsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          transactionsData = response.data;
        } else if (response.data.content && Array.isArray(response.data.content)) {
          transactionsData = response.data.content;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          transactionsData = response.data.data;
        } else if (response.data.transactions && Array.isArray(response.data.transactions)) {
          transactionsData = response.data.transactions;
        }
      }
      
      setTransactions(transactionsData);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions
  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(tx => {
    if (filters.type !== 'all' && tx.type !== filters.type) return false;
    if (filters.search && !tx.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.startDate && new Date(tx.transactionDate) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(tx.transactionDate) > new Date(filters.endDate)) return false;
    return true;
  }) : [];

  // Calculate category breakdown for current month
  const currentMonthTransactions = filteredTransactions.filter(tx => {
    const txMonth = tx.transactionDate?.slice(0, 7);
    return txMonth === selectedMonth && tx.type === 'EXPENSE';
  });

  // Group by category for pie chart
  const categoryData = [];
  const categoryMap = new Map();
  currentMonthTransactions.forEach(tx => {
    const categoryName = tx.category?.name || 'Other';
    const amount = tx.amount || 0;
    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + amount);
  });
  
  const totalExpense = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
  categoryMap.forEach((amount, name) => {
    categoryData.push({
      name: name,
      amount: amount,
      percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0,
      icon: getCategoryIcon(name)
    });
  });
  categoryData.sort((a, b) => b.amount - a.amount);

  // Chart data (income vs expense timeline)
  const chartData = () => {
    const monthlyData = {};
    const transactionsArray = Array.isArray(transactions) ? transactions : [];
    
    transactionsArray.forEach(tx => {
      if (tx.transactionDate) {
        const month = tx.transactionDate.slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 };
        }
        if (tx.type === 'INCOME') {
          monthlyData[month].income += tx.amount || 0;
        } else {
          monthlyData[month].expenses += tx.amount || 0;
        }
      }
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month: month + '-01',
      income: data.income,
      expenses: data.expenses
    })).sort((a, b) => new Date(a.month) - new Date(b.month));
  };

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = () => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Category'];
    const rows = filteredTransactions.map(tx => [
      tx.transactionDate,
      tx.type,
      tx.description,
      tx.amount,
      tx.category?.name || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Transactions</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and track all your financial activities</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Transaction
          </button>
        </div>

        {/* Stats Cards */}
        <TransactionStats transactions={filteredTransactions} loading={loading} />

        {/* Two Column Layout for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncomeExpenseChart data={chartData()} loading={loading} />
          <CategoryPieChart data={categoryData} loading={loading} />
        </div>

        {/* Top Spending Categories and Monthly Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopSpendingCategories data={categoryData.slice(0, 5)} loading={loading} />
          <MonthlySummary selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </div>

        {/* Filters */}
        <TransactionFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          onExport={handleExport}
        />

        {/* Transaction List */}
        <TransactionList 
          transactions={filteredTransactions}
          loading={loading}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modals */}
      <TransactionDetailsModal 
        transaction={selectedTransaction}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
      
      <EditTransactionModal 
        transaction={selectedTransaction}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchTransactions}
      />
      
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </Layout>
  );
};

export default Transactions;