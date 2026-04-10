import React from 'react';
import { X, Calendar, Wallet, Tag, MapPin, CreditCard } from 'lucide-react';

const TransactionDetailsModal = ({ transaction, isOpen, onClose }) => {
  if (!isOpen || !transaction) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Food & Dining': '🍔',
      'Shopping': '🛍️',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Bills & Utilities': '💡',
      'Healthcare': '🏥',
      'Salary': '💰'
    };
    return icons[category?.name] || '💳';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Amount */}
          <div className="text-center">
            <p className={`text-3xl font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.type === 'INCOME' ? '+' : '-'} ₹{transaction.amount?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">{transaction.type}</p>
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Tag size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Description</p>
                <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400">Category</p>
              <p className="text-sm font-medium text-gray-900">{transaction.category?.name || 'Uncategorized'}</p>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar size={16} className="text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(transaction.transactionDate)}</p>
            </div>
          </div>

          {/* Account */}
          {transaction.bankAccount && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CreditCard size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Account</p>
                <p className="text-sm font-medium text-gray-900">{transaction.bankAccount.bankName}</p>
              </div>
            </div>
          )}

          {/* Location */}
          {transaction.location && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <MapPin size={16} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-sm font-medium text-gray-900">{transaction.location}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;