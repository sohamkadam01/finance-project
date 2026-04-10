import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, Filter, ChevronRight } from 'lucide-react';
import TransactionDetailsModal from './TransactionDetailsModal';

const RecentTransactions = ({ transactions, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, income, expense
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Safely get transactions array
  let transactionsArray = [];
  
  if (transactions) {
    if (Array.isArray(transactions)) {
      transactionsArray = transactions;
    } else if (transactions.content && Array.isArray(transactions.content)) {
      transactionsArray = transactions.content;
    } else if (transactions.data && Array.isArray(transactions.data)) {
      transactionsArray = transactions.data;
    }
  }

  // Filter transactions
  let filteredTransactions = [...transactionsArray];
  
  if (searchTerm) {
    filteredTransactions = filteredTransactions.filter(tx => 
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (filterType === 'income') {
    filteredTransactions = filteredTransactions.filter(tx => tx.type === 'INCOME');
  } else if (filterType === 'expense') {
    filteredTransactions = filteredTransactions.filter(tx => tx.type === 'EXPENSE');
  }

  const getCategoryIcon = (category) => {
    if (!category) return '💳';
    const categoryName = typeof category === 'object' ? category.name : category;
    const icons = {
      'Food': '🍔',
      'Food & Dining': '🍔',
      'Shopping': '🛍️',
      'Transport': '🚗',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Bills': '💡',
      'Bills & Utilities': '💡',
      'Salary': '💰',
      'Investment': '📈',
      'Healthcare': '🏥',
      'Education': '📚',
      'Rent': '🏠',
      'Coffee Shops': '☕',
      'Restaurants': '🍽️',
      'Groceries': '🛒',
    };
    return icons[categoryName] || '💳';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      if (date.toDateString() === now.toDateString()) return 'Today';
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Handle transaction click
  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };

  // Handle transaction update
  const handleTransactionUpdate = (updatedTransaction) => {
    if (onRefresh) onRefresh();
  };

  // Handle transaction delete
  const handleTransactionDelete = (transactionId) => {
    if (onRefresh) onRefresh();
  };

  // Calculate summary stats
  const totalIncome = transactionsArray
    .filter(tx => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
  
  const totalExpense = transactionsArray
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  if (transactionsArray.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No transactions yet</h3>
          <p className="text-xs text-gray-500">Add your first transaction to get started</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100">
        {/* Header */}
        <div className="px-6 pt-6 pb-3 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-gray-900">Recent Transactions</h3>
              <p className="text-sm text-gray-500 mt-0.5">Your latest financial activity</p>
            </div>
            
            {/* Summary chips */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500">Income</span>
                <span className="text-sm font-medium text-gray-900">₹{totalIncome.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-gray-500">Expenses</span>
                <span className="text-sm font-medium text-gray-900">₹{totalExpense.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${
                  filterType === 'all' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('income')}
                className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${
                  filterType === 'income' 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setFilterType('expense')}
                className={`px-3 py-1.5 text-xs font-normal rounded-md transition-all ${
                  filterType === 'expense' 
                    ? 'bg-white text-red-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Expenses
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="px-6 pb-4">
          <div className="divide-y divide-gray-100">
            {filteredTransactions.slice(0, 5).map((tx, idx) => {
              const amount = tx.amount || 0;
              const type = tx.type || 'EXPENSE';
              const description = tx.description || 'Unknown transaction';
              const transactionDate = tx.transactionDate || tx.createdAt;
              const category = tx.category;
              const isIncome = type === 'INCOME';
              
              return (
                <div 
                  key={tx.transactionId || idx} 
                  onClick={() => handleTransactionClick(tx)}
                  className="group flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isIncome ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className="text-base">{getCategoryIcon(category)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">{formatDate(transactionDate)}</p>
                        {category && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <p className="text-xs text-gray-400">
                              {typeof category === 'object' ? category.name : category}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 text-sm font-medium ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                      {isIncome ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      ₹{typeof amount === 'number' ? amount.toLocaleString() : parseFloat(amount).toLocaleString()}
                    </div>
                    <ChevronRight size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* View all link */}
          {filteredTransactions.length > 5 && (
            <div className="mt-4 pt-2 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all {filteredTransactions.length} transactions →
              </button>
            </div>
          )}

          {/* No results message */}
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No matching transactions found</p>
              <button 
                onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                className="text-xs text-blue-600 mt-2 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onUpdate={handleTransactionUpdate}
        onDelete={handleTransactionDelete}
      />
    </>
  );
};

export default RecentTransactions;