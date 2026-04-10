import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Award, Calendar, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

const BillHistory = ({ history, loading }) => {
  const [selectedYear, setSelectedYear] = useState('all');
  const [expandedMonth, setExpandedMonth] = useState(null);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-100 rounded-lg"></div>
          <div className="h-64 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bill history yet</h3>
        <p className="text-gray-500">Add bill reminders to start tracking history</p>
      </div>
    );
  }

  const { statistics, yearlySummaries, bills, insights } = history;
  const years = Object.keys(yearlySummaries || {});

  const filteredBills = selectedYear === 'all' 
    ? bills 
    : bills?.filter(bill => bill.dueDate?.startsWith(selectedYear)) || [];

  const getStatusBadge = (status) => {
    if (status === 'PAID') {
      return { text: 'Paid', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle };
    }
    return { text: 'Missed', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle };
  };

  const toggleMonthExpand = (index) => {
    setExpandedMonth(expandedMonth === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Total Spent</p>
            <p className="text-2xl font-semibold text-gray-900">₹{statistics.totalSpentAllTime?.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">On-Time Rate</p>
            <p className="text-2xl font-semibold text-green-600">{statistics.onTimePaymentRate?.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">{statistics.totalBillsPaid} of {statistics.totalBillsPaid + statistics.totalBillsMissed} bills</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Best Streak</p>
            <p className="text-2xl font-semibold text-gray-900">{statistics.consecutiveOnTimePayments} months</p>
            <p className="text-xs text-gray-400 mt-1">Consecutive on-time payments</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Monthly Avg</p>
            <p className="text-2xl font-semibold text-gray-900">₹{statistics.averageMonthlyBill?.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Per month</p>
          </div>
        </div>
      )}

      {/* Year Selector */}
      {years.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedYear('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedYear === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Years
          </button>
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedYear === year
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Award size={18} className="text-blue-600" />
            <h4 className="font-medium text-gray-900">Insights</h4>
          </div>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <p key={idx} className="text-sm text-gray-700">• {insight}</p>
            ))}
          </div>
        </div>
      )}

      {/* Bills List */}
      {filteredBills.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Bill History</h3>
            <p className="text-sm text-gray-500 mt-0.5">All your past bills and payments</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {filteredBills.map((bill, idx) => {
              const status = getStatusBadge(bill.status);
              const StatusIcon = status.icon;
              
              return (
                <div key={idx} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${status.bg} flex items-center justify-center`}>
                        <StatusIcon size={16} className={status.color} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{bill.name}</h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color} border ${status.border}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                          {bill.paidDate && <span>Paid: {new Date(bill.paidDate).toLocaleDateString()}</span>}
                          {bill.daysLate > 0 && <span className="text-red-600">{bill.daysLate} days late</span>}
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-gray-400">{bill.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">₹{bill.amount?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{bill.frequency}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BillHistory;