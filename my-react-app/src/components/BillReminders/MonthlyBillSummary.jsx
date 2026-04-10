import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const MonthlyBillSummary = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <DollarSign size={32} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bill data for this month</h3>
        <p className="text-gray-500">Add bills to see your monthly summary</p>
      </div>
    );
  }

  const { totals, previousMonthComparison, insight, recommendations } = summary;

  const getComparisonColor = (trend) => {
    if (trend === 'DECREASED') return 'text-green-600';
    if (trend === 'INCREASED') return 'text-red-600';
    return 'text-gray-600';
  };

  const getComparisonIcon = (trend) => {
    if (trend === 'DECREASED') return <TrendingDown size={16} />;
    if (trend === 'INCREASED') return <TrendingUp size={16} />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Total Bills</p>
          <p className="text-2xl font-semibold text-gray-900">₹{totals?.totalBills?.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{totals?.totalCount} bills</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Paid</p>
          <p className="text-2xl font-semibold text-green-600">₹{totals?.totalPaid?.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{totals?.paidCount} bills paid</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Unpaid</p>
          <p className="text-2xl font-semibold text-amber-600">₹{totals?.totalUnpaid?.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{totals?.unpaidCount} bills pending</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm text-gray-500 mb-1">Payment Rate</p>
          <p className="text-2xl font-semibold text-blue-600">{totals?.paidPercentage?.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">of bills paid</p>
        </div>
      </div>

      {/* Comparison Card */}
      {previousMonthComparison && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">vs Last Month</p>
              <div className="flex items-center gap-2">
                {getComparisonIcon(previousMonthComparison.trend)}
                <span className={`text-xl font-semibold ${getComparisonColor(previousMonthComparison.trend)}`}>
                  {previousMonthComparison.trend === 'DECREASED' ? '↓' : previousMonthComparison.trend === 'INCREASED' ? '↑' : ''}
                  {Math.abs(previousMonthComparison.changePercentage)}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {previousMonthComparison.changeAmount >= 0 ? '+' : '-'}₹{Math.abs(previousMonthComparison.changeAmount).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Previous Month Total</p>
              <p className="text-lg font-semibold text-gray-900">₹{previousMonthComparison.previousTotal?.toLocaleString()}</p>
              <p className="text-xs text-gray-400">{previousMonthComparison.previousBillCount} bills</p>
            </div>
          </div>
        </div>
      )}

      {/* Insight Card */}
      {insight && (
        <div className="bg-blue-50 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Insight</h4>
              <p className="text-sm text-gray-700">{insight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Alert */}
      {totals?.overdueCount > 0 && (
        <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Overdue Bills</h4>
              <p className="text-sm text-gray-700">
                You have {totals.overdueCount} overdue bill(s) totaling ₹{totals.totalOverdue?.toLocaleString()}.
                Please pay them as soon as possible to avoid late fees.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyBillSummary;