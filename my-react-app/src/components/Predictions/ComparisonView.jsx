import React from 'react';
import { Brain, BarChart3, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';

const ComparisonView = ({ comparison, loading, startDate, endDate }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-100 rounded-xl"></div>
            <div className="h-64 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <Brain size={32} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No comparison data available</h3>
        <p className="text-gray-500">Select a date range to compare prediction methods</p>
      </div>
    );
  }

  const { statistical, ai } = comparison;

  const getBetterMethod = () => {
    if (!statistical || !ai) return null;
    const statConfidence = statistical.confidenceScore || 0;
    const aiConfidence = ai.confidenceScore || 0;
    
    if (statConfidence > aiConfidence) return 'STATISTICAL';
    if (aiConfidence > statConfidence) return 'AI';
    return 'EQUAL';
  };

  const betterMethod = getBetterMethod();

  return (
    <div className="space-y-6">
      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statistical Method Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/30">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              <h3 className="font-medium text-gray-900">Statistical Method</h3>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Based on historical patterns</p>
          </div>
          <div className="p-6">
            {statistical ? (
              <>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-gray-900">₹{statistical.predictedBalance?.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Predicted Balance</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${statistical.confidenceScore || 0}%` }} />
                      </div>
                      <span className="text-sm font-medium">{Math.round(statistical.confidenceScore || 0)}%</span>
                    </div>
                  </div>
                  {statistical.insights && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">{statistical.insights}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">No statistical prediction available</p>
            )}
          </div>
        </div>

        {/* AI Method Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-purple-50/30">
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-purple-600" />
              <h3 className="font-medium text-gray-900">AI Method</h3>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Advanced machine learning</p>
          </div>
          <div className="p-6">
            {ai ? (
              <>
                <div className="text-center mb-4">
                  <p className="text-3xl font-bold text-gray-900">₹{ai.predictedBalance?.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Predicted Balance</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Confidence Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${ai.confidenceScore || 0}%` }} />
                      </div>
                      <span className="text-sm font-medium">{Math.round(ai.confidenceScore || 0)}%</span>
                    </div>
                  </div>
                  {ai.insights && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">{ai.insights}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-8">No AI prediction available</p>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Verdict */}
      {betterMethod && betterMethod !== 'EQUAL' && (
        <div className={`rounded-2xl p-5 ${
          betterMethod === 'STATISTICAL' ? 'bg-blue-50 border border-blue-100' : 'bg-purple-50 border border-purple-100'
        }`}>
          <div className="flex items-center gap-3">
            {betterMethod === 'STATISTICAL' ? <BarChart3 size={20} className="text-blue-600" /> : <Brain size={20} className="text-purple-600" />}
            <div>
              <h4 className="font-medium text-gray-900">Better Method: {betterMethod}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {betterMethod === 'STATISTICAL' 
                  ? 'The statistical method provides higher confidence for your data pattern.'
                  : 'AI predictions are more accurate for your spending patterns.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gray-50 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <CheckCircle size={18} className="text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900">Recommendation</h4>
            <p className="text-sm text-gray-600 mt-1">
              {betterMethod === 'STATISTICAL' 
                ? 'Continue using statistical predictions for reliable forecasts. Your spending pattern is consistent.'
                : 'AI predictions are working well for your variable spending patterns. Keep using AI for better accuracy.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;