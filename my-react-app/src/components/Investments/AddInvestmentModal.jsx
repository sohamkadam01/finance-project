import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const AddInvestmentModal = ({ isOpen, onClose, onSuccess, editingInvestment }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'STOCK',
    amountInvested: '',
    currentValue: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    symbol: '',
    quantity: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingInvestment && isOpen) {
      setFormData({
        name: editingInvestment.name || '',
        type: editingInvestment.type || 'STOCK',
        amountInvested: editingInvestment.amountInvested || '',
        currentValue: editingInvestment.currentValue || '',
        purchaseDate: editingInvestment.purchaseDate || new Date().toISOString().split('T')[0],
        symbol: editingInvestment.symbol || '',
        quantity: editingInvestment.quantity || ''
      });
    } else if (isOpen) {
      resetForm();
    }
  }, [editingInvestment, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'STOCK',
      amountInvested: '',
      currentValue: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      symbol: '',
      quantity: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Please enter investment name');
      return;
    }
    if (!formData.amountInvested || parseFloat(formData.amountInvested) <= 0) {
      setError('Please enter a valid invested amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: formData.name,
        type: formData.type,
        amountInvested: parseFloat(formData.amountInvested),
        currentValue: formData.currentValue ? parseFloat(formData.currentValue) : parseFloat(formData.amountInvested),
        purchaseDate: formData.purchaseDate,
        symbol: formData.symbol || null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null
      };

      let response;
      if (editingInvestment) {
        response = await axios.put(
          `${API_BASE_URL}/investments/${editingInvestment.investmentId}/update-value`,
          { newValue: payload.currentValue },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${API_BASE_URL}/investments/add`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.status === 200 || response.status === 201) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save investment');
    } finally {
      setLoading(false);
    }
  };

  const investmentTypes = [
    { value: 'STOCK', label: 'Stock', icon: '📈' },
    { value: 'MUTUAL_FUND', label: 'Mutual Fund', icon: '📊' },
    { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit', icon: '🏦' },
    { value: 'BOND', label: 'Bond', icon: '📜' },
    { value: 'REAL_ESTATE', label: 'Real Estate', icon: '🏠' },
    { value: 'GOLD', label: 'Gold', icon: '🥇' },
    { value: 'CRYPTO', label: 'Cryptocurrency', icon: '₿' },
    { value: 'ETF', label: 'ETF', icon: '📉' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingInvestment ? 'Update Investment Value' : 'Add Investment'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Investment Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investment Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Reliance Industries, SBI Bluechip Fund"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            {/* Investment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investment Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {investmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Symbol (for stocks) */}
            {formData.type === 'STOCK' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol (Optional)
                </label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleChange}
                  placeholder="e.g., RELIANCE, TCS"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (Optional)
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Number of units/shares"
                step="1"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Amount Invested */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Invested <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  name="amountInvested"
                  value={formData.amountInvested}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Current Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  name="currentValue"
                  value={formData.currentValue}
                  onChange={handleChange}
                  placeholder="Current market value"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Leave blank to use invested amount</p>
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-600">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : (editingInvestment ? 'Update Value' : 'Add Investment')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddInvestmentModal;