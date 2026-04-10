import React, { useState } from 'react';
import { Edit2, Trash2, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';

const BudgetCard = ({ budget, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  
  const { 
    categoryName, 
    categoryIcon, 
    amountLimit, 
    spentAmount, 
    remainingAmount, 
    spentPercentage, 
    alertThreshold,
    isAlertTriggered 
  } = budget;

  const getStatusColor = () => {
    if (spentPercentage >= 100) return 'text-red-600';
    if (spentPercentage >= 80) return 'text-amber-600';
    if (spentPercentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (spentPercentage >= 100) return 'bg-red-500';
    if (spentPercentage >= 80) return 'bg-amber-500';
    if (spentPercentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = () => {
    if (spentPercentage >= 100) return { text: 'Exceeded', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    if (spentPercentage >= 80) return { text: 'At Risk', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' };
    if (spentPercentage >= 60) return { text: 'Moderate', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    return { text: 'Good', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
  };

  const getRemainingDays = () => {
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysLeft = Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const status = getStatusBadge();
  const daysLeft = getRemainingDays();
  const projectedOvershoot = daysLeft > 0 ? (spentAmount / (new Date().getDate())) * daysLeft : 0;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header with Gradient Accent */}
      <div className={`h-1 w-full ${getProgressColor()}`} />
      
      <div className="p-5">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-105 ${
              spentPercentage >= 100 ? 'bg-red-50' :
              spentPercentage >= 80 ? 'bg-amber-50' :
              spentPercentage >= 60 ? 'bg-yellow-50' : 'bg-green-50'
            }`}>
              {categoryIcon || '📊'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{categoryName}</h3>
                <div className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color} border ${status.border}`}>
                  {status.text}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Monthly budget</p>
            </div>
          </div>
          
          {/* Actions Menu - Google Style */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10 min-w-[100px]">
                <button
                  onClick={() => { onEdit(); setShowActions(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => { onDelete(); setShowActions(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Amount Section */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-semibold text-gray-900 tracking-tight">
              ₹{spentAmount.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">
              of ₹{amountLimit.toLocaleString()}
            </span>
          </div>
          
          {/* Progress Bar with Percentage */}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Utilization</span>
              <span className={getStatusColor()}>{spentPercentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor()}`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Row - Google Material */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Remaining</p>
            <p className={`text-base font-semibold ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(remainingAmount).toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2.5 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Days Left</p>
            <p className="text-base font-semibold text-gray-900">{daysLeft}</p>
          </div>
        </div>

        {/* Daily Allowance (if remaining > 0) */}
        {remainingAmount > 0 && daysLeft > 0 && (
          <div className="mb-3 p-2.5 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown size={14} className="text-blue-500" />
                <span className="text-xs text-gray-600">Daily allowance</span>
              </div>
              <span className="text-sm font-medium text-blue-700">
                ₹{(remainingAmount / daysLeft).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}

        {/* Projected Overshoot (if at risk) */}
        {spentPercentage >= 80 && spentPercentage < 100 && daysLeft > 0 && (
          <div className="mb-3 p-2.5 bg-amber-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-xs text-gray-600">Projected at current pace</span>
              </div>
              <span className="text-sm font-medium text-amber-700">
                ₹{projectedOvershoot.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        )}

        {/* Alert Indicator */}
        {isAlertTriggered && spentPercentage < 100 && (
          <div className="mt-3 p-2.5 bg-amber-50 rounded-xl flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-700">
              Alert: You've reached {spentPercentage}% of your budget
              {alertThreshold && ` (Alert at ${alertThreshold}%)`}
            </span>
          </div>
        )}

        {/* Exceeded Alert */}
        {spentPercentage >= 100 && (
          <div className="mt-3 p-2.5 bg-red-50 rounded-xl flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            <span className="text-xs text-red-700">
              Exceeded by ₹{(spentAmount - amountLimit).toLocaleString()}
            </span>
          </div>
        )}

        {/* On Track Success Message */}
        {spentPercentage <= 50 && remainingAmount > 0 && (
          <div className="mt-3 p-2.5 bg-green-50 rounded-xl flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
            <span className="text-xs text-green-700">
              Great progress! You're well within your budget
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Alternative: Compact Google Material Card (for grid view)
export const CompactBudgetCard = ({ budget, onEdit, onDelete }) => {
  const { 
    categoryName, 
    categoryIcon, 
    amountLimit, 
    spentAmount, 
    spentPercentage 
  } = budget;

  const getProgressColor = () => {
    if (spentPercentage >= 100) return 'bg-red-500';
    if (spentPercentage >= 80) return 'bg-amber-500';
    if (spentPercentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-base">
            {categoryIcon || '📊'}
          </div>
          <span className="font-medium text-gray-900 text-sm">{categoryName}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-blue-600">
            <Edit2 size={12} />
          </button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>₹{spentAmount.toLocaleString()}</span>
        <span>of ₹{amountLimit.toLocaleString()}</span>
      </div>
      
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${getProgressColor()}`}
          style={{ width: `${Math.min(spentPercentage, 100)}%` }}
        />
      </div>
      
      <div className="mt-2 text-right">
        <span className={`text-xs font-medium ${
          spentPercentage >= 80 ? 'text-amber-600' : 
          spentPercentage >= 100 ? 'text-red-600' : 'text-gray-500'
        }`}>
          {spentPercentage}% used
        </span>
      </div>
    </div>
  );
};

export default BudgetCard;