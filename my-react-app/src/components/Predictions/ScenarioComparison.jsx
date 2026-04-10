import React, { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react';

const ScenarioComparison = ({ scenarios, loading, startDate, endDate }) => {
  const [selectedScenario, setSelectedScenario] = useState('mostLikely');
  const [expandedRisk, setExpandedRisk] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!scenarios) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <TrendingUp size={32} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No scenario data available</h3>
        <p className="text-gray-500">Add more transactions to generate scenario predictions</p>
      </div>
    );
  }

  const { optimistic, pessimistic, mostLikely, riskAssessment, recommendations } = scenarios;

  const scenariosList = [
    { key: 'optimistic', data: optimistic, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { key: 'mostLikely', data: mostLikely, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { key: 'pessimistic', data: pessimistic, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' }
  ];

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
      case 'MEDIUM': return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'HIGH': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
      default: return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    }
  };

  const riskColors = getRiskColor(riskAssessment?.riskLevel);

  const selectedScenarioData = {
    optimistic, pessimistic, mostLikely
  }[selectedScenario];

  return (
    <div className="space-y-6">
      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenariosList.map((scenario) => {
          const data = scenario.data;
          if (!data) return null;
          
          const isSelected = selectedScenario === scenario.key;
          
          return (
            <button
              key={scenario.key}
              onClick={() => setSelectedScenario(scenario.key)}
              className={`bg-white rounded-2xl border p-5 text-left transition-all hover:shadow-md ${
                isSelected ? `ring-2 ring-blue-500 ${scenario.border}` : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${scenario.bg}`}>
                  <scenario.icon size={18} className={scenario.color} />
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${scenario.bg} ${scenario.color}`}>
                  {data.confidenceLevel}% confidence
                </span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">₹{data.predictedBalance?.toLocaleString()}</p>
              <p className="text-sm font-medium text-gray-700 mt-1 capitalize">{scenario.key.replace('_', ' ')}</p>
              <p className="text-xs text-gray-400 mt-1">Net savings: ₹{data.netSavings?.toLocaleString()}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Scenario Details */}
      {selectedScenarioData && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Scenario Details</h3>
            <p className="text-sm text-gray-500 mt-0.5">{selectedScenarioData.description}</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500">Total Income</p>
                <p className="text-lg font-semibold text-green-600">₹{selectedScenarioData.totalIncome?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Expenses</p>
                <p className="text-lg font-semibold text-red-600">₹{selectedScenarioData.totalExpense?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Net Savings</p>
                <p className="text-lg font-semibold text-blue-600">₹{selectedScenarioData.netSavings?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Change</p>
                <p className="text-lg font-semibold text-gray-900">₹{selectedScenarioData.monthlyChange?.toLocaleString()}</p>
              </div>
            </div>

            {/* Monthly Breakdown */}
            {selectedScenarioData.monthlyBreakdown && selectedScenarioData.monthlyBreakdown.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Projection</h4>
                <div className="space-y-3">
                  {selectedScenarioData.monthlyBreakdown.map((month, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(month.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-green-600">Income: ₹{month.income?.toLocaleString()}</span>
                          <span className="text-xs text-red-500">Expense: ₹{month.expense?.toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-base font-semibold text-blue-600">₹{month.balance?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      {riskAssessment && (
        <div className={`bg-white rounded-2xl border ${riskColors.border} shadow-sm overflow-hidden`}>
          <button
            onClick={() => setExpandedRisk(!expandedRisk)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${riskColors.bg}`}>
                <AlertTriangle size={18} className={riskColors.text} />
              </div>
              <div className="text-left">
                <h3 className="font-medium text-gray-900">Risk Assessment</h3>
                <p className="text-sm text-gray-500">Level: <span className={riskColors.text}>{riskAssessment.riskLevel}</span></p>
              </div>
            </div>
            <ChevronRight size={18} className={`text-gray-400 transition-transform ${expandedRisk ? 'rotate-90' : ''}`} />
          </button>
          
          {expandedRisk && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Emergency Buffer</p>
                  <p className="text-base font-semibold text-gray-900">₹{riskAssessment.emergencyBuffer?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Recommended 6 months of expenses</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">Months of Safety</p>
                  <p className="text-base font-semibold text-gray-900">{riskAssessment.monthsOfSafety} months</p>
                  <p className="text-xs text-gray-400">How long savings would last</p>
                </div>
              </div>
              
              {riskAssessment.riskFactors && riskAssessment.riskFactors.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Risk Factors</p>
                  <div className="space-y-1">
                    {riskAssessment.riskFactors.map((factor, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertTriangle size={12} className="text-yellow-500" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-green-500" />
            <h3 className="font-medium text-gray-900">Recommendations</h3>
          </div>
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioComparison;