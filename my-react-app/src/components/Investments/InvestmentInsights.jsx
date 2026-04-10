import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

const InvestmentInsights = ({ performance, summary, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-100 rounded-lg"></div>
          <div className="h-32 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!performance && !summary) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <Lightbulb size={32} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available</h3>
        <p className="text-gray-500">Add investments to get personalized insights</p>
      </div>
    );
  }

  const totalReturn = performance?.returnsAnalysis?.totalReturnsPercentage || 0;
  const isPositive = totalReturn >= 0;
  const volatility = performance?.returnsAnalysis?.volatility || 0;
  const sharpeRatio = performance?.returnsAnalysis?.sharpeRatio || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={18} className="text-yellow-500" />
        <h3 className="text-base font-medium text-gray-900">Insights & Recommendations</h3>
      </div>

      {/* Overall Insight */}
      {performance?.overallInsight && (
        <div className="mb-4 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800">{performance.overallInsight}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500">Total Return</span>
          </div>
          <p className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{totalReturn.toFixed(1)}%
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-1 mb-1">
            <Shield size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500">Risk Level</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {volatility < 10 ? 'Low' : volatility < 20 ? 'Medium' : 'High'}
          </p>
        </div>
      </div>

      {/* Top Performers */}
      {performance?.topPerformers && performance.topPerformers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Top Performers</h4>
          <div className="space-y-2">
            {performance.topPerformers.slice(0, 3).map((performer, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{performer.name}</span>
                <span className="text-sm font-semibold text-green-600">+{performer.returnsPercentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Performers */}
      {performance?.bottomPerformers && performance.bottomPerformers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Needs Attention</h4>
          <div className="space-y-2">
            {performance.bottomPerformers.slice(0, 3).map((performer, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{performer.name}</span>
                <span className="text-sm font-semibold text-red-600">{performer.returnsPercentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {performance?.recommendations && performance.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
          <div className="space-y-2">
            {performance.recommendations.slice(0, 4).map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentInsights;