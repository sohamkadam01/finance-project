import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Edit2, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const InvestmentsTable = ({ investments, loading, onUpdateValue, onDelete }) => {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }



  if (!investments || investments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <TrendingUp size={32} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No investments yet</h3>
        <p className="text-gray-500">Add your first investment to start tracking</p>
      </div>
    );
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return <ChevronDown size={14} className="opacity-30" />;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredInvestments = investments.filter(inv =>
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.symbol && inv.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedInvestments = [...filteredInvestments].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'returnsPercentage') {
      aVal = a.returnsPercentage;
      bVal = b.returnsPercentage;
    } else if (sortField === 'currentValue') {
      aVal = a.currentValue;
      bVal = b.currentValue;
    } else if (sortField === 'profitLoss') {
      aVal = a.profitLoss;
      bVal = b.profitLoss;
    }
    
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const getReturnColor = (returns) => {
    if (returns > 0) return 'text-green-600';
    if (returns < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getReturnIcon = (returns) => {
    if (returns > 0) return <TrendingUp size={14} className="text-green-600" />;
    if (returns < 0) return <TrendingDown size={14} className="text-red-600" />;
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-gray-900">Investment Holdings</h3>
          <p className="text-sm text-gray-500 mt-0.5">{investments.length} investments</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search investments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center gap-1">Investment {getSortIcon('name')}</div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('type')}>
                <div className="flex items-center justify-end gap-1">Type {getSortIcon('type')}</div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amountInvested')}>
                <div className="flex items-center justify-end gap-1">Invested {getSortIcon('amountInvested')}</div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('currentValue')}>
                <div className="flex items-center justify-end gap-1">Current Value {getSortIcon('currentValue')}</div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('profitLoss')}>
                <div className="flex items-center justify-end gap-1">P&L {getSortIcon('profitLoss')}</div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('returnsPercentage')}>
                <div className="flex items-center justify-end gap-1">Returns {getSortIcon('returnsPercentage')}</div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedInvestments.map((investment) => {
              const isPositive = investment.profitLoss >= 0;
              return (
                <tr key={investment.investmentId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{investment.name}</p>
                      {investment.symbol && (
                        <p className="text-xs text-gray-400">{investment.symbol}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">{investment.type}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">₹{investment.amountInvested?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">₹{investment.currentValue?.toLocaleString()}</td>
                  <td className={`px-6 py-4 text-right text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}₹{Math.abs(investment.profitLoss || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`flex items-center justify-end gap-1 text-sm font-medium ${getReturnColor(investment.returnsPercentage)}`}>
                      {getReturnIcon(investment.returnsPercentage)}
                      {investment.returnsPercentage > 0 ? '+' : ''}{investment.returnsPercentage?.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onUpdateValue(investment)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Update Value"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(investment.investmentId)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestmentsTable;  // ✅ CORRECT - with 'n'