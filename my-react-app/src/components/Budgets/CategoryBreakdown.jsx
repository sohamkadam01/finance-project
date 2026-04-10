import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

const CategoryBreakdown = ({ budgets, loading }) => {
  const [expandedCategories, setExpandedCategories] = useState({});
  const [sortBy, setSortBy] = useState('percentage'); // percentage, name, spent

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!budgets || budgets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <TrendingUp size={24} className="text-gray-300" />
        </div>
        <h4 className="text-base font-medium text-gray-900 mb-1">No budget data</h4>
        <p className="text-sm text-gray-500">Create budgets to see category breakdown</p>
      </div>
    );
  }

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getSortedBudgets = () => {
    const budgetsCopy = [...budgets];
    switch (sortBy) {
      case 'percentage':
        return budgetsCopy.sort((a, b) => b.spentPercentage - a.spentPercentage);
      case 'name':
        return budgetsCopy.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
      case 'spent':
        return budgetsCopy.sort((a, b) => b.spentAmount - a.spentAmount);
      default:
        return budgetsCopy;
    }
  };

  const getStatusBadge = (percentage) => {
    if (percentage >= 100) return { text: 'Exceeded', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle };
    if (percentage >= 80) return { text: 'Warning', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle };
    if (percentage >= 60) return { text: 'Moderate', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: null };
    return { text: 'Good', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle };
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const sortedBudgets = getSortedBudgets();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header with Sort Options */}
      <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-gray-900">Category Breakdown</h3>
          <p className="text-sm text-gray-500 mt-0.5">How you're spending across categories</p>
        </div>
        
        {/* Sort Dropdown - Google Style */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="percentage">Utilization</option>
            <option value="spent">Amount Spent</option>
            <option value="name">Category Name</option>
          </select>
        </div>
      </div>

      {/* Category List */}
      <div className="divide-y divide-gray-100">
        {sortedBudgets.map((budget) => {
          const status = getStatusBadge(budget.spentPercentage);
          const percentage = Math.min(budget.spentPercentage, 100);
          const isExpanded = expandedCategories[budget.categoryId];
          const remaining = budget.amountLimit - budget.spentAmount;
          const StatusIcon = status.icon;
          
          return (
            <div key={budget.categoryId} className="hover:bg-gray-50/50 transition-colors">
              {/* Category Row - Clickable to expand */}
              <button
                onClick={() => toggleCategoryExpand(budget.categoryId)}
                className="w-full px-6 py-4 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
                    {budget.categoryIcon || '📊'}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{budget.categoryName}</h4>
                      <div className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color} border ${status.border}`}>
                        {status.text}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      ₹{budget.spentAmount.toLocaleString()} of ₹{budget.amountLimit.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {budget.spentPercentage}%
                    </p>
                    <p className="text-xs text-gray-400">utilized</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-6 pb-5 pt-2 border-t border-gray-100 bg-gray-50/30">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Progress Section */}
                    <div className="sm:col-span-2">
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Budget Utilization</span>
                          <span>{budget.spentPercentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(budget.spentPercentage)}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Budget:</span>
                          <span className="font-medium text-gray-900 ml-1">₹{budget.amountLimit.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Spent:</span>
                          <span className="font-medium text-gray-900 ml-1">₹{budget.spentAmount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Remaining:</span>
                          <span className={`font-medium ml-1 ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{Math.abs(remaining).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Insight Section */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                      <div className="flex items-start gap-2">
                        {StatusIcon ? (
                          <StatusIcon size={14} className={`${status.color} mt-0.5`} />
                        ) : (
                          <TrendingUp size={14} className="text-gray-400 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-medium text-gray-700">Insight</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {budget.spentPercentage >= 100 
                              ? `You've exceeded your ${budget.categoryName} budget by ₹${Math.abs(remaining).toLocaleString()}`
                              : budget.spentPercentage >= 80
                              ? `You're close to your ${budget.categoryName} budget limit`
                              : budget.spentPercentage >= 60
                              ? `You've used ${budget.spentPercentage}% of your ${budget.categoryName} budget`
                              : `Great job! You're well within your ${budget.categoryName} budget`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Good (≤60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-600">Moderate (61-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-xs text-gray-600">Warning (81-99%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Exceeded (≥100%)</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {budgets.length} categories • Click on any category for details
          </div>
        </div>
      </div>
    </div>
  );
};

// Alternative: Compact Version (No expandable sections)
export const CompactCategoryBreakdown = ({ budgets, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!budgets || budgets.length === 0) return null;

  const sortedBudgets = [...budgets].sort((a, b) => b.spentPercentage - a.spentPercentage);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900">Category Breakdown</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {sortedBudgets.map((budget) => (
          <div key={budget.categoryId} className="px-6 py-3">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-base">{budget.categoryIcon || '📊'}</span>
                <span className="text-sm font-medium text-gray-700">{budget.categoryName}</span>
              </div>
              <span className="text-sm text-gray-900">
                ₹{budget.spentAmount.toLocaleString()} / ₹{budget.amountLimit.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    budget.spentPercentage >= 100 ? 'bg-red-500' :
                    budget.spentPercentage >= 80 ? 'bg-amber-500' :
                    budget.spentPercentage >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budget.spentPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">
                {budget.spentPercentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryBreakdown;